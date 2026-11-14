import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { IPaymentHold } from '../../core/models/payment-hold.model';
import { formatNaira } from '../../core/naira';
import { PaymentHoldsService } from '../../core/services/payment-holds';
import { Skeleton } from '../../shared/skeleton/skeleton';
import { Svg } from '../../shared/svg/svg';
import { AuthenticationService } from '../auth/services/auth.service';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * The page a student's portal is locked to once a payment deadline passes
 * unpaid (the user, 2026-11-11): what is overdue, how much, since when, and
 * the way to pay it. Outside the shell, like `/details` — there is nothing
 * else to wander off into until it is paid.
 *
 * Opening it asks the server afresh, so a student who has just paid (or had
 * a deadline moved) is let straight back in.
 */
@Component({
  selector: 'app-payment-required',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Skeleton, Svg],
  templateUrl: './payment-required.html',
  styleUrl: './payment-required.scss',
})
export class PaymentRequired implements OnInit {
  private readonly holdsApi = inject(PaymentHoldsService);
  private readonly auth = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly holds = signal<readonly IPaymentHold[]>([]);

  ngOnInit(): void {
    this.check();
  }

  check(): void {
    this.loading.set(true);
    this.holdsApi
      .refresh()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (holds) => {
          if (holds.length === 0) {
            void this.router.navigateByUrl('/dashboard');
            return;
          }
          this.holds.set(holds);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  payPath(hold: IPaymentHold): string {
    return hold.kind === 'DUES' ? '/dues' : '/school-fees';
  }

  payLabel(hold: IPaymentHold): string {
    return hold.kind === 'DUES' ? 'Pay your dues' : 'Pay your school fees';
  }

  money(kobo: number): string {
    return formatNaira(kobo);
  }

  /** "30 November 2026" — the deadline's date as it was set. */
  date(iso: string): string {
    const date = new Date(iso);
    return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  }

  signOut(): void {
    this.holdsApi.clear();
    this.auth.logOut();
  }
}
