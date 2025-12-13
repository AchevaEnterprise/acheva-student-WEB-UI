import { Component, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IMenu } from '../../../../core/models/menu.model';
import { Svg } from '../../../../shared/svg/svg';

@Component({
  selector: 'app-settings-menu-list',
  imports: [RouterLink, RouterLinkActive, Svg],
  templateUrl: './settings-menu-list.html',
  styleUrl: './settings-menu-list.scss',
})
export class SettingsMenuList {
  private readonly router = inject(Router);
  menu = input<IMenu[]>();

  isActiveRoute(menu: IMenu): boolean {
    return this.router.url.includes(menu.route);
  }
}
