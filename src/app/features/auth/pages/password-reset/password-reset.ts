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
                accountId: (res.data as { user: { id: string } }).user.id,
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
