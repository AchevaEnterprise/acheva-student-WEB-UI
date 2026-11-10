import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { detailsGuard } from './core/guards/details.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth',
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.route').then((m) => m.routes),
  },
  {
    /**
     * The details the transcript prints, asked for before anything else.
     * Outside the shell on purpose: there is no menu to wander off into
     * until it is done. Also reached from Settings to correct a detail.
     */
    path: 'details',
    canMatch: [authGuard],
    data: { title: 'Your Details' },
    loadComponent: () =>
      import('./features/student-details/student-details').then((m) => m.StudentDetails),
  },
  {
    path: '',
    canMatch: [authGuard],
    canActivate: [detailsGuard],
    loadChildren: () => import('./layout/layout.routes').then((m) => m.routes),
  },
  { path: '**', redirectTo: '' },
];
