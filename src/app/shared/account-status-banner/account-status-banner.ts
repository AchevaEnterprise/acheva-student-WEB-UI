import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../core/store/app.state';
import { profileSelector } from '../../core/store/profile/profile.selector';

/**
 * Persistent notice for withdrawn/suspended students.
 *
 * The backend already enforces the restriction — a deactivated student keeps
 * read access to results published before `deactivatedAt` and silently
 * receives nothing after it. Without this banner that enforcement is
 * invisible, and the student reads missing results as a bug.
 */
@Component({
  selector: 'app-account-status-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './account-status-banner.html',
  styleUrl: './account-status-banner.scss',
})
export class AccountStatusBanner {
  private readonly store = inject(Store<AppState>);

  private readonly profile = this.store.selectSignal(profileSelector);

  /**
   * Only render once the profile has actually loaded and reports
   * `isActive: false`. A null profile must never flash the banner, and
   * legacy documents without the field are treated as active.
   */
  readonly isDeactivated = computed(() => this.profile()?.student?.isActive === false);

  /** Null on legacy records deactivated before the timestamp was tracked. */
  readonly deactivatedAt = computed(() => this.profile()?.student?.deactivatedAt ?? null);
}
