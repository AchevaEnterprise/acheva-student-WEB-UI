import { IMenu } from '../models/menu.model';

export const MENU: IMenu[] = [
  {
    label: 'Dashboard',
    active_icon: 'icons/menu/dashboard-active.svg',
    inactive_icon: 'icons/menu/dashboard-inactive.svg',
    route: 'dashboard',
    isActive: true,
  },
  {
    label: 'My Result',
    active_icon: 'icons/menu/result-chart-active.svg',
    inactive_icon: 'icons/menu/result-chart-inactive.svg',
    route: 'results',
    isActive: true,
  },
  {
    label: 'Payment History',
    active_icon: 'icons/menu/history-active.svg',
    inactive_icon: 'icons/menu/history-inactive.svg',
    route: 'payment-history',
    isActive: true,
  },
  // {
  //   label: 'FAQ',
  //   active_icon: 'icons/menu/faq-inactive.svg',
  //   inactive_icon: 'icons/menu/faq-inactive.svg',
  //   route: 'faq',
  //   isActive: true,
  // },
  // {
  //   label: 'Support & Help',
  //   active_icon: 'icons/menu/support-inactive.svg',
  //   inactive_icon: 'icons/menu/support-inactive.svg',
  //   route: 'support',
  //   isActive: true,
  // },
  {
    label: 'User Settings',
    active_icon: 'icons/menu/settings-active.svg',
    inactive_icon: 'icons/menu/settings-inactive.svg',
    route: 'settings',
    isActive: true,
  },
];
