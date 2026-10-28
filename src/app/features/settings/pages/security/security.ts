import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ToastService } from '../../../../core/utility/toast.service';
import { Button } from '../../../../shared/form/button/button';
import { AuthenticationService } from '../../../auth/services/auth.service';

/**
 * Reset password while signed in.
 *
 * The same proof as "Forgot your password?": a code is emailed to the
 * address on the account and must be entered with the new password. Knowing
 * that someone left a laptop signed in is therefore not enough to take the
 * account over. Resetting ends the other sessions (server-side).
 */
@Component({
  selector: 'app-security',
  imports: [Button],
  templateUrl: './security.html',
  styleUrl: './security.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Security {
  private readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly email = this.authService.activeAccount()?.email ?? '';
  readonly sending = signal(false);

  startReset(): void {
    if (!this.email || this.sending()) return;
    this.sending.set(true);
    this.authService
      .forgotPassword(this.email)
      .pipe(
        finalize(() => this.sending.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.toast.showNotification(
            'success',
            'Check your email',
            `A 6-digit code was sent to ${this.email}. Enter it with your new password.`
          );
          this.router.navigate(['/auth/create-password'], {
            queryParams: {
              email: this.email,
              requestId: (res.data as { requestId: string }).requestId,
            },
          });
        },
      });
  }
}
