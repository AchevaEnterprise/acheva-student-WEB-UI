import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthenticationService } from '../../features/auth/services/auth.service';
import { StudentService } from '../services/student';

/**
 * Keeps a student on `/details` until they have given the details their
 * transcript prints. Runs on the way into the portal shell, so every page
 * behind it waits for the form.
 *
 * The stored flag is trusted only when it says "done": a session signed in
 * before the flag existed, or one that says "still needed", asks the server.
 * A failed check lets the student through — a network blip must not lock
 * someone out of their own results.
 *
 * Where they were going rides along as `next`, so a link from an email
 * ("See my results") still lands on the page it named once the form is done.
 */
export const detailsGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthenticationService);
  const students = inject(StudentService);
  const router = inject(Router);

  if (!auth.activeAccount()) auth.loadInitialSession();
  if (auth.activeAccount()?.detailsRequired === false) return true;

  const toForm = () =>
    router.createUrlTree(['/details'], {
      queryParams: state.url && state.url !== '/' ? { next: state.url } : {},
    });

  return students.getMyDetails().pipe(
    map((resp) => {
      const required = resp.data?.required ?? false;
      auth.setDetailsRequired(required);
      return required ? toForm() : true;
    }),
    catchError(() => of(true))
  );
};
