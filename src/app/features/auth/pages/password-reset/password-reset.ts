import { Component, inject, OnDestroy, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { AuthenticationService } from '../../services/auth.service';
import { Svg } from '../../../../shared/svg/svg';
import { Button } from '../../../../shared/form/button/button';
import { SvgBackground } from '../../components/svg-background/svg-background';

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
            this.router.navigate(['/auth/verify-email'], {
              queryParams: {
                email: this.emailCtrl.value as string,
                accountId: res.data.user.id as string,
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
