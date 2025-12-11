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
      {
        path: 'results',
        data: {
          title: 'My Result',
        },
        loadComponent: () => import('../features/results/results').then((m) => m.Results),
      },
      {
        path: 'payment-history',
        data: {
          title: 'Payment History',
        },
        loadComponent: () =>
          import('../features/payment-history/payment-history').then((m) => m.PaymentHistory),
      },
      {
        path: 'faq',
        data: {
          title: 'FAQs',
        },
        loadComponent: () => import('../features/faq/faq').then((m) => m.Faq),
      },
      {
        path: 'support',
        data: {
          title: 'Support & Help',
        },
        loadComponent: () => import('../features/support/support').then((m) => m.Support),
      },
      {
        path: 'settings',
        loadChildren: () => import('../features/settings/settings.routes').then((m) => m.routes),
      },
    ],
  },
];
