import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';

import { formatNaira } from '../../core/naira';
import { ToastService } from '../../core/utility/toast.service';
import { Skeleton } from '../../shared/skeleton/skeleton';
import { IDuesInstalment, IDuesStandingPage, PaymentChoice } from './models/dues.model';
import { DuesService } from './services/dues.service';

/**
 * Departmental dues — what a student owes, and how to settle it.
 *
 * ## The page answers one question first
 *
 * "How much do I still owe?" is the only thing most students open this for,
 * so it is the largest thing on the page and the first thing rendered. The
 * schedule, the history and the session picker are all secondary to that
 * number.
 *
 * ## Paying is a CHOICE, never an amount
 *
 * The two buttons send `FULL` or `NEXT_INSTALMENT`; the server works out the
 * figure from the plan and what has already been paid. A page that posted an
 * amount would be a page where the price is whatever the browser says.
 *
 * ## Older sessions stay payable
 *
 * Dues from a year or two back do get settled late. The university does not
 * sanction it, but it happens, so the session picker reaches back to the
 * first year Acheva ran — never forward, which would be paying for a year
 * that has not started.
 */
@Component({
  selector: 'app-dues',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, Skeleton],
  templateUrl: './dues.html',
  styleUrl: './dues.scss',
})
export class Dues implements OnInit {
  private readonly api = inject(DuesService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly starting = signal<PaymentChoice | null>(null);
  readonly page = signal<IDuesStandingPage | null>(null);
  readonly selectedSession = signal<string>('');

  readonly plan = computed(() => this.page()?.config ?? null);
  readonly standing = computed(() => this.page()?.standing ?? null);
  readonly payments = computed(() => this.page()?.payments ?? []);
  readonly sessions = computed(() => this.page()?.selectableSessions ?? []);

  readonly hasPlan = computed(() => this.plan() !== null);
  readonly isSettled = computed(() => this.standing()?.status === 'PAID');
  readonly hasStarted = computed(() => (this.standing()?.paidKobo ?? 0) > 0);

  /** Is the student looking at a year other than the one they are in? */
  readonly isPastSession = computed(() => {
    const page = this.page();
    return page ? page.session !== page.activeSession : false;
  });

  /** 0–100, for the progress bar. Guarded against a zero-total plan. */
  readonly paidPercent = computed(() => {
    const standing = this.standing();
    if (!standing || standing.totalKobo <= 0) return 0;
    return Math.min(100, Math.round((standing.paidKobo / standing.totalKobo) * 100));
  });

  readonly canPay = computed(() => this.hasPlan() && !this.isSettled() && this.starting() === null);

  ngOnInit(): void {
    this.load();
  }

  private load(session?: string): void {
    this.loading.set(true);
    this.api
      .standing(session)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.page.set(resp.data);
          this.selectedSession.set(resp.data.session);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.showNotification(
            'error',
            'Could not load your dues',
            err?.error?.message ?? 'Please try again.'
          );
        },
      });
  }

  changeSession(session: string): void {
    if (!session || session === this.selectedSession()) return;
    this.selectedSession.set(session);
    this.load(session);
  }

  /**
   * Hand the student to the payment provider.
   *
   * A full-page redirect rather than a popup: a popup is the thing phone
   * browsers block, and losing the window mid-payment is the worst moment
   * for it to happen.
   */
  pay(choice: PaymentChoice): void {
    const plan = this.plan();
    if (!plan || !this.canPay()) return;

    this.starting.set(choice);
    this.api
      .pay(plan.id, choice)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          const link = resp.data?.paymentLink;
          if (!link) {
            this.starting.set(null);
            this.toast.showNotification(
              'error',
              'Could not start the payment',
              'No payment link came back. Please try again.'
            );
            return;
          }
          window.location.href = link;
        },
        error: (err) => {
          this.starting.set(null);
          // A 5xx carries "Internal Server Error" — not something to show.
          const serverFault = (err?.status ?? 0) >= 500;
          this.toast.showNotification(
            'error',
            'Could not start the payment',
            (!serverFault && err?.error?.message) ||
              'The payment page could not be opened. Nothing was charged — please try again in a moment.'
          );
        },
      });
  }

  /**
   * Has this instalment been covered by what is already paid?
   *
   * Compared on the running total, not instalment by instalment, because a
   * student who paid a lump sum has covered several at once.
   */
  isCovered(instalment: IDuesInstalment): boolean {
    const paid = this.standing()?.paidKobo ?? 0;
    const plan = this.plan();
    if (!plan) return false;

    let cumulative = 0;
    for (const row of plan.instalments) {
      cumulative += row.amount;
      if (row.position === instalment.position) break;
    }
    return paid >= cumulative;
  }

  /** The instalment the student is being asked for next, if any. */
  isNext(instalment: IDuesInstalment): boolean {
    return this.standing()?.nextInstalment?.position === instalment.position;
  }

  money(kobo: number): string {
    return formatNaira(kobo);
  }

  trackByPosition = (_: number, item: IDuesInstalment) => item.position;
  trackByReference = (_: number, item: { reference: string }) => item.reference;
}
