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
        path: 'registration',
        data: {
          title: 'Course Registration',
        },
        loadComponent: () =>
          import('../features/registration/registration').then((m) => m.Registration),
      },
      {
        path: 'dues',
        data: {
          title: 'Departmental Dues',
        },
        loadComponent: () => import('../features/dues/dues').then((m) => m.Dues),
      },
      {
        /**
         * Paystack's `callback_url` lands here. It used to land nowhere —
         * the path fell through the `**` wildcard to the dashboard, so a
         * student paid real money and the app said nothing about it.
         */
        path: 'dues/complete',
        data: {
          title: 'Payment',
        },
        loadComponent: () =>
          import('../features/dues/payment-complete/payment-complete').then(
            (m) => m.PaymentComplete
          ),
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
        path: 'messages',
        data: {
          title: 'Messages',
          // A chat owns its viewport and scrolls internally — see `Layout`.
          fullBleed: true,
        },
        loadComponent: () => import('../features/messages/messages').then((m) => m.Messages),
      },
      {
        path: 'support',
        data: {
          title: 'Support & Help',
          fullBleed: true,
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
