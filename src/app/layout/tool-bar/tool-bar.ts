import { Component, inject, OnInit, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ImageFallbackDirective } from '../../core/directives/image-fallback.directive';
import { UtilityService } from '../../core/utility/utility.service';
import { AuthenticationService } from '../../features/auth/services/auth.service';
import { Svg } from '../../shared/svg/svg';

@Component({
  selector: 'app-tool-bar',
  imports: [MatBadgeModule, MatMenuModule, ImageFallbackDirective, Svg],
  templateUrl: './tool-bar.html',
  styleUrl: './tool-bar.scss',
})
export class ToolBar implements OnInit {
  private readonly authService = inject(AuthenticationService);
  private readonly utilityService = inject(UtilityService);
  // private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  activeAccount = this.authService.activeAccount;

  pageTitle = signal<string>('');
  breadcrumbs = signal<{ label: string; link?: string }[]>([]);
  badgeCount = signal<string>(this.utilityService.formatCount(0));
  // notifications = signal<INotification[]>([]);
  unreadCount = signal<number>(0);

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe({
      next: () => {
        let currentRoute = this.route;
        while (currentRoute.firstChild) currentRoute = currentRoute.firstChild;

        const data = currentRoute.snapshot.data;
        this.pageTitle.set(data['title'] ?? '');
        this.breadcrumbs.set(data['breadcrumbs'] ?? []);
      },
    });
  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  openNotification() {
    // this.dialog.open(NotificationsComponent, {
    //   width: '30%',
    //   height: '98%',
    //   position: { right: '10px' },
    // });
  }

  private loadNotifications() {
    // this.notificationService.getNotifications().subscribe({
    //   next: (resp) => {
    //     if (resp.status && resp.data) {
    //       this.notifications.set(resp.data);
    //       const unreadNotifications = resp.data.filter(
    //         (n: INotification) => n.status === 'UNREAD'
    //       );
    //       const count = unreadNotifications.length;
    //       this.unreadCount.set(count);
    //       this.badgeCount.set(count > 0 ? count.toString() : '');
    //     }
    //   },
    //   error: (error) => {
    //     this.badgeCount.set('');
    //   },
    // });
  }

  navigateTo(link: string) {
    this.router.navigate([link]);
  }
}
