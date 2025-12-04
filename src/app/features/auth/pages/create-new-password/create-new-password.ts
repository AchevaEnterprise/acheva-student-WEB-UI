import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { debounceTime, finalize, Subscription } from 'rxjs';
import { ToastService } from '../../../../core/utility/toast.service';
import { Button } from '../../../../shared/form/button/button';
import { Svg } from '../../../../shared/svg/svg';
import { PasswordValidity } from '../../components/password-validity/password-validity';
import { SvgBackground } from '../../components/svg-background/svg-background';
import { IResetPassword } from '../../models/auth.model';
import { AuthenticationService } from '../../services/auth.service';

@Component({
  selector: 'app-create-new-password',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    Svg,
    Button,
    ReactiveFormsModule,
    MatIconModule,
    SvgBackground,
    PasswordValidity,
  ],
  templateUrl: './create-new-password.html',
  styleUrl: './create-new-password.scss',
})
export class CreateNewPassword implements OnInit, OnDestroy {
  private readonly authService = inject(AuthenticationService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  passwordMatchError = signal<string>('');

  form: FormGroup = new FormGroup({
    password: new FormControl('', Validators.required),
    confirm_password: new FormControl('', Validators.required),
  });

  isLoading = signal(false);
  private readonly sub: Subscription = new Subscription();

  ngOnInit(): void {
    this.passwordMatchListener();
  }

  passwordMatchListener() {
    this.form.controls['confirm_password'].valueChanges.pipe(debounceTime(800)).subscribe({
      next: (confirmedPassword: string) => {
        const { password } = this.form.value as { password: string };
        if (password !== confirmedPassword) this.passwordMatchError.set('Password do not match');
        else this.passwordMatchError.set('');
      },
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update((val) => !val);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update((val) => !val);
  }

  submitForm() {
    const { password, confirm_password } = this.form.value as {
      password: string;
      confirm_password: string;
    };

    if (password !== confirm_password) {
      this.passwordMatchError.set('Password do not match');
      return;
    }

    this.isLoading.set(true);
    const payload: IResetPassword = {
      // token: this.token!,
      password,
      confirmPassword: confirm_password,
    };

    this.sub.add(
      this.authService
        .resetPassword(payload)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (resp) => {
            if (resp.status) {
              this.toast.showNotification(
                'success',
                'Password Reset',
                'Your password reset is successful'
              );

              this.router.navigate(['/auth/login']);
            }
          },
        })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
