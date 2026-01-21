import { TitleCasePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs';
import { ImageFallbackDirective } from '../../core/directives/image-fallback.directive';
import { INotification } from '../../core/models/notification.model';
import { AppState } from '../../core/store/app.state';
import { loadNotification } from '../../core/store/notification/notification.action';
import { notificationSelector } from '../../core/store/notification/notification.selector';
import { UtilityService } from '../../core/utility/utility.service';
import { AuthenticationService } from '../../features/auth/services/auth.service';
import { Notification } from '../../shared/notification/notification';
import { Svg } from '../../shared/svg/svg';

@Component({
  selector: 'app-tool-bar',
  imports: [MatBadgeModule, MatMenuModule, ImageFallbackDirective, Svg, TitleCasePipe],
  templateUrl: './tool-bar.html',
  styleUrl: './tool-bar.scss',
})
export class ToolBar implements OnInit {
  private readonly authService = inject(AuthenticationService);
  private readonly utilityService = inject(UtilityService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly store = inject(Store<AppState>);

  activeAccount = this.authService.activeAccount;

  pageTitle = signal<string>('');
  breadcrumbs = signal<{ label: string; link?: string }[]>([]);
  badgeCount = signal<string>(this.utilityService.formatCount(0));
  notifications = signal<INotification[]>([]);
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
    this.dialog.open(Notification, {
      width: '30%',
      height: '98%',
      position: { right: '10px' },
      data: {
        notifications: this.notifications(),
      },
    });
  }

  private loadNotifications() {
    this.store.dispatch(loadNotification());
    this.store.select(notificationSelector).subscribe({
      next: (notifications) => {
        this.notifications.set(notifications);

        const unreadNotifications = notifications.filter(
          (n: INotification) => n.status === 'UNREAD'
        ).length;
        this.unreadCount.set(unreadNotifications);
        this.badgeCount.set(unreadNotifications > 0 ? unreadNotifications.toString() : '');
      },
      error: (error) => {
        this.badgeCount.set('');
      },
    });
  }

  navigateTo(link: string) {
    this.router.navigate([link]);
  }
}
