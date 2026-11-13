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

import { formatNaira, toKobo, toNaira } from '../../core/naira';
import { ToastService } from '../../core/utility/toast.service';
import { Skeleton } from '../../shared/skeleton/skeleton';
import { IDuesStandingPage, PaymentChoice } from './models/dues.model';

/** The least share of the total one payment may be — the server's rule too. */
const MIN_PAYMENT_PERCENT = 30;

/** One allowed payment, as the schedule lists it. */
interface IPaymentRow {
  readonly position: number;
  readonly dueDate: string;
  readonly note: string | null;
  readonly state: 'paid' | 'next' | 'later';
  /** What they paid, for a payment already made. */
  readonly paidKobo: number | null;
}
import { DuesService } from './services/dues.service';
import { deadlinePassed } from '../../core/utility/deadline';

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
 * ## The student chooses how much to pay (2026-11-09)
 *
 * Within the department's plan: at least 30% of the total each time (or
 * whatever is left), never more than is owed, and the last allowed payment
 * clears the balance. The page checks as they type so the button only lights
 * for an amount that will be accepted — but the server decides, and says why
 * if it refuses.
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
  readonly graduatedSession = computed(() => this.page()?.graduatedSession ?? null);
  readonly awaitingResultsFor = computed(() => this.page()?.awaitingResultsFor ?? null);

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

  readonly next = computed(() => this.standing()?.nextPayment ?? null);
  readonly minimumPercent = MIN_PAYMENT_PERCENT;

  /** The amount field, as typed, in naira. Prefilled with the suggestion. */
  readonly amountNaira = signal('');
  readonly amountKobo = computed(() => toKobo(this.amountNaira()));

  /** Why the typed amount would be refused, or null when it is fine. */
  readonly amountProblem = computed(() => {
    const next = this.next();
    if (!next) return null;
    const kobo = this.amountKobo();
    if (!Number.isInteger(kobo) || kobo <= 0) return 'Enter an amount.';
    if (kobo > next.maximumKobo) return `You owe ${this.money(next.maximumKobo)}.`;
    if (next.mustClear && kobo !== next.maximumKobo) {
      return `Your last allowed payment must clear the balance of ${this.money(next.maximumKobo)}.`;
    }
    if (kobo < next.minimumKobo) return `Pay at least ${this.money(next.minimumKobo)}.`;
    return null;
  });

  /**
   * Payment by payment: what they paid for those made, and which is next.
   * Matched by count — the second payment they made is payment 2, whatever
   * its size.
   */
  readonly paymentRows = computed<IPaymentRow[]>(() => {
    const plan = this.plan();
    const made = this.standing()?.paymentsMade ?? 0;
    if (!plan) return [];
    const paidInOrder = [...this.payments()]
      .sort((a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime())
      .map((payment) => payment.amount);
    return plan.instalments.map((row, index) => ({
      position: row.position,
      dueDate: row.dueDate,
      note: row.note,
      state: index < made ? 'paid' : index === made && !this.isSettled() ? 'next' : 'later',
      paidKobo: index < made ? (paidInOrder[index] ?? null) : null,
    }));
  });

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
          const suggested = resp.data.standing?.nextPayment?.suggestedKobo;
          this.amountNaira.set(suggested ? String(toNaira(suggested)) : '');
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
    if (choice === 'AMOUNT' && this.amountProblem()) return;

    this.starting.set(choice);
    this.api
      .pay(plan.id, choice, choice === 'AMOUNT' ? this.amountKobo() : undefined)
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
          // Pressed Pay with an earlier checkout still open: say where they
          // are going before the page changes under them.
          if (resp.data.resumed) {
            this.toast.showNotification(
              'success',
              resp.data.alreadyPaid ? 'That payment went through' : 'Continuing your payment',
              resp.data.alreadyPaid
                ? 'Your earlier payment was completed. Showing it now.'
                : `You already started a payment of ${this.money(resp.data.amount ?? 0)}. Taking you back to finish it.`
            );
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

  onAmountInput(event: Event): void {
    this.amountNaira.set((event.target as HTMLInputElement).value);
  }

  money(kobo: number): string {
    return formatNaira(kobo);
  }

  /** The due date is a deadline: open all through that day, passed after it. */
  deadlinePassed(dueDate: string | Date | null | undefined): boolean {
    return deadlinePassed(dueDate);
  }

  trackByReference = (_: number, item: { reference: string }) => item.reference;
}
