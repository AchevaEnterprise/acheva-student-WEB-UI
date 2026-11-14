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
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { formatNaira, toKobo, toNaira } from '../../core/naira';
import { ToastService } from '../../core/utility/toast.service';
import { Skeleton } from '../../shared/skeleton/skeleton';
import { ISchoolFeeReceipt, ISchoolFeesPage, PaymentChoice } from './models/school-fees.model';
import { grossUpForPaystack } from './paystack-charge';
import { SchoolFeesService } from './services/school-fees.service';
import { deadlinePassed } from '../../core/utility/deadline';

/** The least share of the fee one payment may be — the server's rule too. */
const MIN_PAYMENT_PERCENT = 30;

interface IPaymentRow {
  readonly position: number;
  readonly dueDate: string;
  readonly note: string | null;
  readonly state: 'paid' | 'next' | 'later';
  readonly paidKobo: number | null;
}

/**
 * School fees — what the university charges for the session, and paying it
 * (2026-11-09).
 *
 * Built like Departmental Dues on purpose, down to the stylesheet: one
 * number first ("how much do I still owe?"), then the amount box with the
 * 30% rule checked as they type, then the schedule. What is new here is the
 * line that matters most to a student mid-session — whether their fees let
 * them register: one payment opens first semester, the whole fee second.
 */
@Component({
  selector: 'app-school-fees',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, NgTemplateOutlet, RouterLink, Skeleton],
  templateUrl: './school-fees.html',
  styleUrls: ['../dues/dues.scss', './school-fees.scss'],
})
export class SchoolFees implements OnInit {
  private readonly api = inject(SchoolFeesService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly starting = signal<PaymentChoice | null>(null);
  readonly page = signal<ISchoolFeesPage | null>(null);

  readonly fee = computed(() => this.page()?.fee ?? null);
  readonly standing = computed(() => this.page()?.standing ?? null);
  readonly clearance = computed(() => this.page()?.clearance ?? null);
  readonly completed = computed(() =>
    (this.page()?.payments ?? []).filter(
      (payment) => payment.status === 'COMPLETED' && payment.session === this.page()?.session
    )
  );

  readonly isSettled = computed(() => this.standing()?.status === 'PAID');
  readonly payable = computed(() => this.page()?.payable !== false);
  readonly canPay = computed(
    () => !!this.fee() && !this.isSettled() && this.payable() && this.starting() === null
  );

  readonly paidPercent = computed(() => {
    const standing = this.standing();
    if (!standing || standing.totalKobo <= 0) return 0;
    return Math.min(100, Math.round((standing.paidKobo / standing.totalKobo) * 100));
  });

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

  /** Payment by payment — matched by count, as on the dues page. */
  readonly paymentRows = computed<IPaymentRow[]>(() => {
    const made = this.standing()?.paymentsMade ?? 0;
    // Every payment that counts, in order — online ones and the receipts
    // for payments made at the bank, which count from upload.
    const session = this.page()?.session;
    const counted = [
      ...this.completed().map((payment) => ({ at: payment.paidAt, amount: payment.amount })),
      ...this.receipts()
        .filter((receipt) => receipt.session === session && receipt.status !== 'REJECTED')
        .map((receipt) => ({ at: receipt.uploadedAt, amount: receipt.amount })),
    ];
    const paidInOrder = counted
      .sort((a, b) => new Date(a.at ?? 0).getTime() - new Date(b.at ?? 0).getTime())
      .map((payment) => payment.amount);
    return (this.page()?.schedule ?? []).map((row, index) => ({
      position: row.position,
      dueDate: row.dueDate,
      note: row.note,
      state: index < made ? 'paid' : index === made && !this.isSettled() ? 'next' : 'later',
      paidKobo: index < made ? (paidInOrder[index] ?? null) : null,
    }));
  });

  /** "Statistics", "500 Level fee", "Extra Year 1" — what the charge is for. */
  readonly feeFor = computed(() => {
    const fee = this.fee();
    if (!fee) return '';
    const parts = [fee.department, fee.option].filter(Boolean);
    const level = fee.level ? `${fee.level} Level fee` : '';
    const standing =
      fee.standingLabel && !fee.standingLabel.endsWith('Level') ? fee.standingLabel : '';
    return [...parts, standing, level].filter(Boolean).join(' · ');
  });

  /** Receipts for payments made elsewhere, this session first. */
  readonly receipts = computed(() => this.page()?.receipts ?? []);
  readonly canUploadReceipt = computed(() => !!this.page()?.canUploadReceipt);

  /**
   * Paystack's charge on what they are about to pay online — on top, so the
   * university receives the fee in full (the user, 2026-11-10).
   */
  readonly onlineCharge = computed(() => {
    const pricing = this.page()?.paystackPricing;
    const amount = this.amountKobo();
    if (!pricing || !Number.isInteger(amount) || amount <= 0) return null;
    return grossUpForPaystack(amount, pricing);
  });

  /** The same for paying the whole balance. */
  readonly balanceCharge = computed(() => {
    const pricing = this.page()?.paystackPricing;
    const outstanding = this.standing()?.outstandingKobo ?? 0;
    return pricing && outstanding > 0 ? grossUpForPaystack(outstanding, pricing) : null;
  });

  receiptStatus(receipt: ISchoolFeeReceipt): string {
    if (receipt.status === 'VERIFIED') return 'Verified';
    if (receipt.status === 'REJECTED') return 'Not accepted';
    return 'Counted · not yet checked';
  }

  /**
   * Open one of my receipt files in a new tab. The tab is opened inside the
   * click — one opened after the download is blocked as a popup — and
   * pointed at the file when it arrives.
   */
  openReceipt(receipt: ISchoolFeeReceipt, which: 'schoolFeeReceipt' | 'remitaReceipt'): void {
    const tab = window.open('', '_blank');
    this.api
      .receiptFile(receipt._id, which)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          if (tab) tab.location.href = url;
          else window.location.assign(url);
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
        },
        error: () => {
          tab?.close();
          this.toast.showNotification('error', 'Could not open the receipt', 'Please try again.');
        },
      });
  }

  readonly subtitle = computed(() => {
    const session = this.page()?.session;
    return session
      ? `What the university charges you for ${session}, and what you have paid.`
      : 'What the university charges you, and what you have paid.';
  });

  /**
   * Every allowed payment has been made (a bank payment counts as one) and
   * something is still owed: what is left is one payment, not "payment 2 of 2".
   */
  readonly paymentsUsedUp = computed(() => {
    const standing = this.standing();
    return !!standing && standing.paymentsMade >= standing.paymentsAllowed;
  });

  readonly optionMissing = computed(() => /choose your option/i.test(this.page()?.reason ?? ''));

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api
      .mine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.page.set(resp.data);
          const suggested = resp.data.standing?.nextPayment?.suggestedKobo;
          this.amountNaira.set(suggested ? String(toNaira(suggested)) : '');
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.showNotification(
            'error',
            'Could not load your school fees',
            err?.error?.message ?? 'Please try again.'
          );
        },
      });
  }

  /**
   * Hand the student to Paystack — a full-page redirect, not a popup, which
   * phone browsers block at the worst possible moment.
   */
  pay(choice: PaymentChoice): void {
    if (!this.canPay()) return;
    if (choice === 'AMOUNT' && this.amountProblem()) return;

    this.starting.set(choice);
    this.api
      .pay(choice, choice === 'AMOUNT' ? this.amountKobo() : undefined)
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
}
