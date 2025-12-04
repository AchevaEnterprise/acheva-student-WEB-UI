import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnDestroy } from '@angular/core';
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

  showPassword = signal(false);
  isLoading = signal(false);
  private readonly sub: Subscription = new Subscription();

  form: FormGroup = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    password: new FormControl<string>('', Validators.required),
  });

  submitForm() {
    this.isLoading.set(true);

    this.sub.add(
      this.authService
        .signIn(this.form.value)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.status) this.router.navigate(['/dashboard']);
          },
        })
    );
  }

  togglePasswordVisibility() {
    this.showPassword.update((show) => !show);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
