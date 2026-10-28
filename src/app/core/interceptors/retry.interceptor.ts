import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { retry, throwError, timer } from 'rxjs';

/**
 * Retry once, and only where a retry is safe and can help: a read (GET/HEAD)
 * that failed in transit or at the gateway.
 *
 * It used to retry EVERY failure once, POSTs and 4xx answers included. A
 * wrong password was sent twice, so a student hit the 5-per-minute sign-in
 * limit after two typos, and a write that failed after the server had acted
 * on it was repeated.
 */
const RETRYABLE_METHODS = new Set(['GET', 'HEAD']);
const RETRYABLE_STATUSES = new Set([0, 502, 503, 504]);

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (!RETRYABLE_METHODS.has(req.method)) return next(req);

  return next(req).pipe(
    retry({
      count: 1,
      delay: (error: unknown) =>
        error instanceof HttpErrorResponse && RETRYABLE_STATUSES.has(error.status)
          ? timer(1000)
          : throwError(() => error),
    })
  );
};
