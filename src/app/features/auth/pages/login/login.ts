import { CommonModule } from '@angular/common';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Component, inject, signal, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Button } from '../../../../shared/form/button/button';
import { Svg } from '../../../../shared/svg/svg';
import { AuthBanner } from '../../components/auth-banner/auth-banner';
import { Subscription, finalize } from 'rxjs';
import { AuthenticationService } from '../../services/auth.service';
import { ToastService } from '../../../../core/utility/toast.service';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatRippleModule,
    MatIconModule,
    MatPrefix,
    MatSuffix,
    AuthBanner,
    Button,
    Svg,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnDestroy {
  private readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  showPassword = signal(false);
  isLoading = signal(false);
  private readonly sub: Subscription = new Subscription();

  form: FormGroup = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    password: new FormControl<string>('', Validators.required),
  });

  constructor() {
    // Phone keyboards append a space after an autocompleted address; the
    // email validator then failed and "Log In" stayed disabled with no
    // explanation. An email address never contains whitespace.
    const email = this.form.controls['email'];
    email.valueChanges.pipe(takeUntilDestroyed()).subscribe((value: string | null) => {
      const trimmed = (value ?? '').trim();
      if (value !== trimmed) email.setValue(trimmed, { emitEvent: false });
    });
  }

  submitForm() {
    // A double-click lands both clicks before the button re-renders disabled,
    // and every extra sign-in counts against the 5-per-minute limit.
    if (this.isLoading()) return;
    this.isLoading.set(true);

    this.sub.add(
      this.authService
        .signIn(this.form.value)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.status) this.router.navigate(['/dashboard']);
          },
          error: (err: HttpErrorResponse) => {
            if (
              err.status === HttpStatusCode.Forbidden &&
              err.error?.message === 'email not verified'
            ) {
              this.resumeVerification(this.form.value.email as string);
            }
          },
        })
    );
  }

  /**
   * The password was right but the email was never confirmed — usually the
   * student left the code page during sign-up, and nothing led back to it.
   * Send a fresh code and take them there.
   */
  private resumeVerification(email: string) {
    this.authService.resendEmailVerification(email).subscribe({
      next: (res) => {
        const user = (res.data as { user?: { id: string } }).user;
        if (!user) return;
        this.toast.showNotification(
          'warning',
          'Confirm your email',
          `We sent a new code to ${email}. Enter it to finish setting up your account.`
        );
        void this.router.navigate(['/auth/confirm-email'], {
          queryParams: { accountId: user.id, email },
        });
      },
      error: () => undefined,
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update((show) => !show);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
