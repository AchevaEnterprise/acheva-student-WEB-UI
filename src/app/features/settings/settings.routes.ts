import { Routes } from '@angular/router';
import { Settings } from './settings';

export const routes: Routes = [
  {
    path: '',
    component: Settings,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'profile',
      },
      {
        path: 'profile',
        data: {
          title: 'Settings',
        },
        loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'notifications',
        data: {
          title: 'Settings',
        },
        loadComponent: () =>
          import('./pages/notifications/notifications').then((m) => m.Notifications),
      },
      {
        path: 'security',
        data: {
          title: 'Settings',
        },
        loadComponent: () => import('./pages/security/security').then((m) => m.Security),
      },
      {
        path: 'signature',
        data: {
          title: 'Settings',
        },
        loadComponent: () => import('./pages/signature/signature').then((m) => m.Signature),
      },
    ],
  },
];
