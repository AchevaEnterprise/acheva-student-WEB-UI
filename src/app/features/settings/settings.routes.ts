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
        path: 'security',
        data: {
          title: 'Settings',
        },
        loadComponent: () => import('./pages/security/security').then((m) => m.Security),
      },
      // notifications / signature are unbuilt stubs and absent from the menu,
      // so they are not routed. A deep link falls through to the dashboard.
    ],
  },
];
