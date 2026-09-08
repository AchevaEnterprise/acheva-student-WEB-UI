import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from '../core/store/app.state';
import { loadProfile } from '../core/store/profile/profile.action';
import { AuthenticationService } from '../features/auth/services/auth.service';
import { MessagingService } from '../features/messages/services/messaging.service';
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messaging = inject(MessagingService);
  private readonly destroyRef = inject(DestroyRef);

  expanded = signal<boolean>(true);
  screenWidth = signal<number>(window.innerWidth);

  /** Whether the routed page owns the whole viewport. Declared per route. */
  readonly fullBleed = signal<boolean>(false);

  constructor() {
    this.authService.loadInitialSession();
    this.store.dispatch(loadProfile());
    this.trackFullBleedRoutes();

    // The message stream runs for the whole session, not only while the chat
    // is on screen: the sidebar badges have to move wherever you are, and a
    // reply that lands while you are reading your results must already be in
    // hand when you navigate over.
    this.messaging.start();
    this.destroyRef.onDestroy(() => this.messaging.stop());
  }

  private trackFullBleedRoutes(): void {
    this.fullBleed.set(this.routeWantsFullBleed());
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.fullBleed.set(this.routeWantsFullBleed()));
  }

  /** The flag can be declared at any depth, so the whole branch is checked. */
  private routeWantsFullBleed(): boolean {
    let node: ActivatedRoute | null = this.route;
    while (node) {
      // `snapshot` is not populated on a child route until the navigation
      // that activates it has finished, and this runs once before that.
      if (node.snapshot?.data?.['fullBleed'] === true) return true;
      node = node.firstChild;
    }
    return false;
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
