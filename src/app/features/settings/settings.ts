import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IMenu } from '../../core/models/menu.model';
import { SettingsMenuList } from './component/settings-menu-list/settings-menu-list';

@Component({
  selector: 'app-settings',
  imports: [RouterOutlet, SettingsMenuList],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  settings: IMenu[] = [
    {
      label: 'Profile Settings',
      description: 'Personal information and other details',
      route: 'profile',
      active_icon: 'icons/general/active-profile-settings-icon.svg',
      inactive_icon: 'icons/general/active-profile-settings-icon.svg',
      isActive: false,
    },
    // {
    //   label: 'Notifications',
    //   description: 'General notifications settings',
    //   route: 'notifications',
    //   active_icon: 'icons/general/inactive-bell-settings-icon.svg',
    //   inactive_icon: 'icons/general/inactive-bell-settings-icon.svg',
    //   isActive: false,
    // },
    // {
    //   label: 'Security',
    //   description: 'Change password',
    //   route: 'security',
    //   active_icon: 'icons/general/inactive-security-settings-icon.svg',
    //   inactive_icon: 'icons/general/inactive-security-settings-icon.svg',
    //   isActive: false,
    // },
    // {
    //   label: 'Signature',
    //   description: 'Change password',
    //   route: 'signature',
    //   active_icon: 'icons/general/inactive-security-settings-icon.svg',
    //   inactive_icon: 'icons/general/inactive-security-settings-icon.svg',
    //   isActive: false,
    // },
  ];
}
