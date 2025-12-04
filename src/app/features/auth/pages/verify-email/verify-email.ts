import { Component, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { ToastService } from '../../../../core/utility/toast.service';
import { Button } from '../../../../shared/form/button/button';
import { SvgBackground } from '../../components/svg-background/svg-background';
import { AuthenticationService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  imports: [Button, SvgBackground],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail implements OnDestroy {
  private readonly authService = inject(AuthenticationService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = signal(this.route.snapshot.queryParamMap.get('email'));
  accountId = signal(this.route.snapshot.queryParamMap.get('accountId'));

  isLoading = signal(false);
  private readonly sub: Subscription = new Subscription();

  goBack() {
    history.back();
  }

  resendVerificationEmail() {
    this.isLoading.set(true);
    this.sub.add(
      this.authService
        .resendEmailVerification(this.email()!)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.status) {
              this.toast.showNotification(
                'success',
                'Verification Email Sent',
                'An email verification has been sent'
              );
            }
          },
        })
    );
  }

  continue() {
    this.router.navigate(['/auth/confirm-email'], {
      queryParams: {
        accountId: this.accountId() as string,
        email: this.email() as string,
      },
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
