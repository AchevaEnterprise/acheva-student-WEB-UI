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
        /**
         * Extra year. A sibling of `registration` rather than a tab inside
         * it: the two are different acts with different rules, and an
         * ordinary student should never meet this screen.
         */
        path: 'registration/extra-year',
        data: {
          title: 'Extra Year',
        },
        loadComponent: () =>
          import('../features/registration/extra-year/extra-year').then((m) => m.ExtraYear),
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
      // `/faq` is not routed: the page is an unbuilt stub ("faq works!") and is
      // not in the menu. A deep link now falls through to the dashboard.
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
