import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../core/store/app.state';
import { loadProfile } from '../core/store/profile/profile.action';
import { AuthenticationService } from '../features/auth/services/auth.service';
import { AccountStatusBanner } from '../shared/account-status-banner/account-status-banner';
import { SideBar } from './side-bar/side-bar';
import { ToolBar } from './tool-bar/tool-bar';

@Component({
  selector: 'app-layout',
  imports: [SideBar, ToolBar, RouterOutlet, AccountStatusBanner],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  private readonly authService = inject(AuthenticationService);
  private readonly store = inject(Store<AppState>);

  expanded = signal<boolean>(true);
  screenWidth = signal<number>(window.innerWidth);

  constructor() {
    this.authService.loadInitialSession();
    this.store.dispatch(loadProfile());
  }

  onToggleSideNav(data: { expanded: boolean }) {
    this.expanded.set(data.expanded);
  }

  getBodyClass = computed(() => {
    let styleClass = '';
    const expanded = this.expanded();
    const screenWidth = this.screenWidth();

    if (expanded && screenWidth > 768) styleClass = 'w-[calc(100%_-_16.5625rem)] ml-[16.5625rem]';
    else if (expanded && screenWidth <= 768) styleClass = 'w-[calc(100%_-_5rem)] ml-[5rem]';

    return styleClass;
  });
}
