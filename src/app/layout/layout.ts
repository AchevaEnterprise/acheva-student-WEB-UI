import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ToastService } from '../core/utility/toast.service';
import { selectProfile } from '../core/store/profile/profile.selector';
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
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  /** Set by `account:changed`, so the move is announced once it has loaded. */
  private announceNextMove = false;

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

    this.followPlacement();
  }

  /**
   * Keep the department and level on screen equal to the student's record.
   *
   * Every time the live profile loads — on start, and again when the server
   * says a transfer has taken effect — its placement is folded into the
   * stored account, which the dashboard, the toolbar and the results queries
   * read. A transferred student therefore sees their new department without
   * signing out, and the moment it happens if the portal is open.
   */
  private followPlacement(): void {
    this.store
      .select(selectProfile)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        const student = state?.profile?.student;
        if (!student) return;
        const moved = this.authService.adoptLivePlacement(student);
        if (moved && this.announceNextMove) {
          this.announceNextMove = false;
          this.toast.showNotification(
            'success',
            'Your department has changed',
            `You are now in ${student.department?.name ?? 'your new department'}, ${student.level} level.`
          );
        }
      });

    this.messaging.accountChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.announceNextMove = true;
      this.store.dispatch(loadProfile());
    });
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
