import { Component, computed, inject, output, signal } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MENU } from '../../core/constants/menu';
import { IMenu } from '../../core/models/menu.model';
import { AuthenticationService } from '../../features/auth/services/auth.service';
import { PaymentHoldsService } from '../../core/services/payment-holds';
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

  private readonly holds = inject(PaymentHoldsService);

  /**
   * While a missed payment deadline has the portal locked (2026-11-11), only
   * the pages for paying it — the rest would only bounce to the lock page.
   */
  appMenu = computed<IMenu[]>(() =>
    this.holds.locked() ? MENU.filter((menu) => this.holds.openRoutes().includes(menu.route)) : MENU
  );
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
    this.holds.clear();
    this.authService.logOut();
  }
}
