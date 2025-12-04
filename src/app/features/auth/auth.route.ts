import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    data: {
      title: 'Login',
      description: 'Login to your account',
    },
  },
  {
    path: 'create-account',
    loadComponent: () => import('./pages/sign-up/sign-up').then((m) => m.SignUp),
    data: {
      title: 'Create Account',
      description: 'Create a new account',
    },
  },
  {
    path: 'password-reset',
    loadComponent: () =>
      import('./pages/password-reset/password-reset').then((m) => m.PasswordReset),
    data: {
      title: 'Reset Password',
      description: 'Reset your password',
    },
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./pages/verify-email/verify-email').then((m) => m.VerifyEmail),
    data: {
      title: 'Verify Email',
      description: 'Verify your email',
    },
  },
  {
    path: 'confirm-email',
    loadComponent: () => import('./pages/confirm-email/confirm-email').then((m) => m.ConfirmEmail),
    data: {
      title: 'Confirm Email',
      description: 'Confirm your email',
    },
  },
  {
    path: 'create-password',
    loadComponent: () =>
      import('./pages/create-new-password/create-new-password').then((m) => m.CreateNewPassword),
    data: {
      title: 'Create New Password',
      description: 'Create your new password',
    },
  },
];
