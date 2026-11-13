import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Subject, switchMap, take, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../features/auth/services/auth.service';
import { PaymentHoldsService } from '../services/payment-holds';
import { ToastService } from '../utility/toast.service';

let refreshInProgress = false;
let refreshSubject = new Subject<string>();
let refreshFailureCount = 0;
const maxRefreshFailures = 2;
let lastRefreshFailure = 0;
const refreshCooldownMs = 30000; // 30 seconds

export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthenticationService);
  const toast = inject(ToastService);
  const router = inject(Router);
  const holds = inject(PaymentHoldsService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === HttpStatusCode.Unauthorized) {
        const refreshToken = authService.getRefreshToken;

        if (!refreshToken) {
          authService.logOut();
          toast.showNotification('warning', 'Session Expired', 'Please sign in again.');
          return throwError(() => error);
        }

        if (refreshInProgress) {
          return refreshSubject.pipe(
            take(1),
            switchMap((newToken) => {
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });
              return next(retryReq);
            })
          );
        }

        refreshInProgress = true;

        // Circuit breaker check
        const now = Date.now();
        if (
          refreshFailureCount >= maxRefreshFailures &&
          now - lastRefreshFailure < refreshCooldownMs
        ) {
          authService.logOut();
          return throwError(() => new Error('Token refresh circuit breaker active'));
        }

        return authService.refreshToken(refreshToken).pipe(
          switchMap((res) => {
            const { accessToken, refreshToken: newRefreshToken } = res.data;
            authService.setToken(accessToken);
            authService.setRefreshToken(newRefreshToken);

            refreshSubject.next(accessToken);
            refreshSubject.complete();

            refreshInProgress = false;
            refreshSubject = new Subject<string>(); // reinitialize
            refreshFailureCount = 0;

            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${accessToken}` },
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            refreshInProgress = false;
            refreshSubject.complete();
            refreshSubject = new Subject<string>();

            refreshFailureCount++;
            lastRefreshFailure = Date.now();

            authService.logOut();
            toast.showNotification('warning', 'Session Expired', 'Please sign in again.');
            return throwError(() => refreshError);
          })
        );
      }

      // Requests tagged with X-Silent-Error skip all toasts — matches the staff
      // portal's convention. Used by logout, where the user is already signed
      // out locally and has nothing to act on.
      if (req.headers.has('X-Silent-Error')) {
        return throwError(() => error);
      }

      // A missed payment deadline has the portal locked (2026-11-11): not an
      // error to toast — take them to the page that explains it and lets
      // them pay.
      if (error.status === HttpStatusCode.Forbidden && error.error?.code === 'PAYMENT_HOLD') {
        holds.refresh().subscribe({ error: () => undefined });
        void router.navigateByUrl('/payment-required');
        return throwError(() => error);
      }

      if (error.status === HttpStatusCode.Forbidden) {
        toast.showNotification(
          'error',
          'Unauthorized',
          error.error.message || 'You are unauthorized'
        );
      }

      if (error.status === HttpStatusCode.BadRequest) {
        toast.showNotification('error', 'Error Occurred', error.error.message);
      }

      // Sign-in, sign-up and reset are rate-limited. Without this the button
      // simply stopped spinning and nothing said why.
      if (error.status === HttpStatusCode.TooManyRequests) {
        toast.showNotification(
          'warning',
          'Too many attempts',
          'Please wait a minute, then try again.'
        );
      }

      // A page LOADING something that is not there yet is not an error the
      // student did — the page shows its own empty state (2026-11-10). Only
      // an action that hits a missing record is worth a toast.
      if (error.status === HttpStatusCode.NotFound && req.method !== 'GET') {
        toast.showNotification(
          'error',
          'Resource Not Found',
          error.error.message || 'The resource you are trying to access does not exist'
        );
      }

      // Never echo a 500's text: the server answers "Internal Server Error",
      // which tells a student nothing they can act on.
      if (error.status === HttpStatusCode.InternalServerError) {
        toast.showNotification(
          'error',
          'Something went wrong',
          'We could not complete that. Please try again in a moment.'
        );
      }

      return throwError(() => error);
    })
  );
};
