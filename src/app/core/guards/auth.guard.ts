import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthenticationService } from '../../features/auth/services/auth.service';
import { ToastService } from '../utility/toast.service';

/**
 * Lets a signed-in student into the shell; sends everyone else to the login
 * page.
 *
 * It RETURNS a UrlTree rather than calling `router.navigate` and returning
 * false. It is a `canMatch` guard on the `''` route, which matches every
 * URL — so navigating to `/login` from inside it ran this guard again, which
 * navigated again, forever, in microtasks. The tab froze solid on any deep
 * link opened while signed out, and on every page once a session expired.
 */
export const authGuard: CanMatchFn = () => {
  const authService = inject(AuthenticationService);
  const toast = inject(ToastService);
  const router = inject(Router);

  if (authService.isAuthenticated) return true;

  const target = router.getCurrentNavigation()?.extractedUrl.toString() ?? '';
  if (target && target !== '/') {
    toast.showNotification('warning', 'Please sign in', 'Sign in to continue to that page.');
  }

  return router.createUrlTree(['/auth/login']);
};
