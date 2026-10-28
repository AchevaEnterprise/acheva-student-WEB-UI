import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { Button } from '../../../../shared/form/button/button';
import { Svg } from '../../../../shared/svg/svg';
import { SvgBackground } from '../../components/svg-background/svg-background';
import { AuthenticationService } from '../../services/auth.service';
import { ToastService } from '../../../../core/utility/toast.service';

@Component({
  selector: 'app-password-reset',
  imports: [
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    Svg,
    Button,
    ReactiveFormsModule,
    SvgBackground,
  ],
  templateUrl: './password-reset.html',
  styleUrl: './password-reset.scss',
})
export class PasswordReset implements OnDestroy {
  private readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  isLoading = signal(false);
  private readonly sub: Subscription = new Subscription();

  readonly emailCtrl: FormControl = new FormControl('', [Validators.email, Validators.required]);

  goBack() {
    history.back();
  }

  resetPassword() {
    this.isLoading.set(true);
    this.sub.add(
      this.authService
        .forgotPassword(this.emailCtrl.value)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (res) => {
            // It used to move on in silence, leaving the student to guess
            // that a code had been emailed.
            this.toast.showNotification(
              'success',
              'Check your email',
              'If that address has an account, a 6-digit code is on its way. Enter it below.'
            );
            /**
             * Straight to the page that actually resets the password.
             *
             * This used to route to `/auth/verify-email`, which walks the
             * SIGN-UP verification flow and ends by calling
             * `PATCH /auth/verify-email/:id` — so a student asking to reset
             * their password was never asked for a new one. The reset page
             * was unreachable.
             */
            this.router.navigate(['/auth/create-password'], {
              queryParams: {
                email: this.emailCtrl.value as string,
                requestId: (res.data as { requestId: string }).requestId,
              },
            });
          },
        })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
