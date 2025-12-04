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
    label: 'Courses',
    active_icon: 'icons/menu/courses-active.svg',
    inactive_icon: 'icons/menu/courses-inactive.svg',
    route: 'courses',
    isActive: true,
  },
  {
    label: 'My Result',
    active_icon: 'icons/menu/my-result-inactive.svg',
    inactive_icon: 'icons/menu/my-result-inactive.svg',
    route: 'my-result',
    isActive: true,
  },
  {
    label: 'Result Management',
    active_icon: 'icons/menu/result-management-inactive.svg',
    inactive_icon: 'icons/menu/result-management-inactive.svg',
    route: 'result-management',
    isActive: true,
  },
  {
    label: 'Students',
    active_icon: 'icons/menu/students-inactive.svg',
    inactive_icon: 'icons/menu/students-inactive.svg',
    route: 'students',
    isActive: true,
  },
  {
    label: 'History',
    active_icon: 'icons/menu/history-inactive.svg',
    inactive_icon: 'icons/menu/history-inactive.svg',
    route: 'history',
    isActive: true,
  },
  {
    label: 'Dues Management',
    active_icon: 'icons/menu/dues-management-inactive.svg',
    inactive_icon: 'icons/menu/dues-management-inactive.svg',
    route: 'dues-management',
    isActive: true,
  },
  {
    label: 'FAQ',
    active_icon: 'icons/menu/faq-inactive.svg',
    inactive_icon: 'icons/menu/faq-inactive.svg',
    route: 'faq',
    isActive: true,
  },
  {
    label: 'Support & Help',
    active_icon: 'icons/menu/support-inactive.svg',
    inactive_icon: 'icons/menu/support-inactive.svg',
    route: 'support',
    isActive: true,
  },
  {
    label: 'User Settings',
    active_icon: 'icons/menu/settings-inactive.svg',
    inactive_icon: 'icons/menu/settings-inactive.svg',
    route: 'user-settings',
    isActive: true,
  },
];
