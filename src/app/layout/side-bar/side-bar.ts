import { Component, inject, output, signal } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MENU } from '../../core/constants/menu';
import { IMenu } from '../../core/models/menu.model';
import { AuthenticationService } from '../../features/auth/services/auth.service';
import { Svg } from '../../shared/svg/svg';

@Component({
  selector: 'app-side-bar',
  imports: [Svg, RouterLink, RouterLinkActive, MatDividerModule, MatMenuModule, MatDividerModule],
  templateUrl: './side-bar.html',
  styleUrl: './side-bar.scss',
})
export class SideBar {
  private readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);

  appMenu = signal<IMenu[]>(MENU);
  activeAccount = this.authService.activeAccount;

  expanded = signal<boolean>(window.innerWidth > 768);
  toggleSideNav = output<{ expanded: boolean }>();

  isActiveRoute(menu: IMenu): boolean {
    return this.router.url.includes(menu.route);
  }

  toggleSideBar() {
    this.expanded.update((val) => !val);
    this.toggleSideNav.emit({
      expanded: this.expanded(),
    });
  }

  logout() {
    this.authService.logOut();
  }
}
