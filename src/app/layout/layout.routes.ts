import { Routes } from '@angular/router';
import { Layout } from './layout';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: '/dashboard',
      },
      {
        path: 'dashboard',
        data: {
          title: 'Dashboard',
        },
        loadComponent: () => import('../features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      // {
      //   path: 'support',
      //   data: {
      //     title: 'Support & Help',
      //   },
      //   loadComponent: () =>
      //     import('../@features/support/support.component').then(
      //       (m) => m.SupportComponent
      //     ),
      // },
      // {
      //   path: 'user-settings',
      //   data: {
      //     title: 'User Settings',
      //   },
      //   loadChildren: () =>
      //     import('../@features/user-settings/user-settings.routes').then(
      //       (m) => m.routes
      //     ),
      // },
    ],
  },
];
