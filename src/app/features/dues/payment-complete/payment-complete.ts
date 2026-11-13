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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';

import { environment } from '../../../../environments/environment';
import { IAPIResponse } from '../../../core/models/api-response.model';
import { formatNaira } from '../../../core/naira';
import { profileSelector } from '../../../core/store/profile/profile.selector';
import { ToastService } from '../../../core/utility/toast.service';
import { PaymentHoldsService } from '../../../core/services/payment-holds';
import {
  IPaymentSuccessDetail,
  IPaymentSuccessStanding,
  IPaymentSuccessUnlock,
  PaymentSuccess,
} from '../../../shared/payment-success/payment-success';
import { Skeleton } from '../../../shared/skeleton/skeleton';
import { ReceiptExportService } from '../../payment-history/export/receipt-export.service';
import { IPaymentReceipt } from '../../payment-history/models/payment.model';
import { PaymentsService } from '../../payment-history/services/payments.service';
import { ISchoolFeesPage } from '../../school-fees/models/school-fees.model';
import { SchoolFeesService } from '../../school-fees/services/school-fees.service';

interface IVerifiedPayment {
  readonly reference: string;
  readonly status: string;
  /** KOBO. */
  readonly amount: number;
  readonly currency: string;
  readonly purpose: string;
}

/** How often, and how many times, a still-confirming payment is re-checked. */
const RECHECK_MS = 4000;
const RECHECK_LIMIT = 10;

/**
 * Where Paystack sends the student back to — the success page for every
 * online payment (2026-11-11): departmental dues, school fees, a transcript
 * fee from before it was dropped.
 *
 * The page asks the server what actually happened rather than trusting the
 * redirect: a browser coming back proves only that the browser came back.
 * Once the money is confirmed it shows the receipt's facts — amount, what it
 * was for, where it leaves the student, what it opened — with the receipt to
 * download (it carries a verify.acheva.app QR). While Paystack is still
 * confirming it re-checks on its own; the server's reconciler settles the
 * payment within a minute even if this page is closed.
 */
@Component({
  selector: 'app-payment-complete',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Skeleton, PaymentSuccess],
  templateUrl: './payment-complete.html',
  styleUrl: './payment-complete.scss',
})
export class PaymentComplete implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly payments = inject(PaymentsService);
  private readonly schoolFees = inject(SchoolFeesService);
  private readonly exporter = inject(ReceiptExportService);
  private readonly toast = inject(ToastService);
  private readonly holds = inject(PaymentHoldsService);
  private readonly profile = inject(Store).selectSignal(profileSelector);

  readonly checking = signal(true);
  readonly payment = signal<IVerifiedPayment | null>(null);
  readonly failed = signal(false);
  readonly receipt = signal<IPaymentReceipt | null>(null);
  readonly feesPage = signal<ISchoolFeesPage | null>(null);
  readonly downloading = signal(false);
  private rechecks = 0;
  private recheckTimer: ReturnType<typeof setTimeout> | null = null;

  readonly reference = computed(() => this.route.snapshot.queryParamMap.get('reference') ?? '');

  readonly settled = computed(() => this.payment()?.status === 'COMPLETED');
  /**
   * Paystack said no (declined, abandoned, cancelled). These fell into the
   * "Still confirming… do not pay again" branch, telling a student whose
   * payment had failed to wait for it and not retry.
   */
  readonly notCompleted = computed(() =>
    ['FAILED', 'CANCELLED', 'REJECTED'].includes(this.payment()?.status ?? '')
  );
  readonly isTranscript = computed(() => this.payment()?.purpose === 'TRANSCRIPT');
  readonly isSchoolFees = computed(() => this.payment()?.purpose === 'SCHOOL_FEES');
  readonly stillChecking = computed(() => this.rechecksLeft() > 0);
  private readonly rechecksLeft = signal(RECHECK_LIMIT);

  private readonly institution = computed(() => this.profile()?.student?.school?.name ?? '');

  // ── What the success page says ──────────────────────────────────────────

  readonly eyebrow = computed(() => {
    const session = this.receipt()?.item.session;
    const kind = this.isSchoolFees()
      ? 'School fees'
      : this.isTranscript()
        ? 'Transcript fee'
        : 'Departmental dues';
    return session ? `${kind} · ${session}` : kind;
  });

  readonly title = computed(() => {
    const standing = this.receipt()?.standing;
    if (this.isSchoolFees()) {
      return standing?.settled ? 'Your school fees are paid' : 'School fees payment received';
    }
    if (this.isTranscript()) return 'Payment received';
    return standing?.settled ? 'Your dues are paid' : 'Dues payment received';
  });

  readonly lead = computed(() => {
    const name = this.firstName();
    const standing = this.receipt()?.standing;
    const thanks = name ? `Thank you, ${name}. ` : '';
    if (standing?.settled)
      return `${thanks}This payment clears the balance — nothing more is owed.`;
    if (standing) {
      return `${thanks}Your payment is confirmed. ${this.money(standing.outstandingKobo)} is still to pay.`;
    }
    return `${thanks}Your payment is confirmed.`;
  });

  readonly amountNote = computed(() => {
    const receipt = this.receipt();
    const fee = receipt?.processingFeeKobo ?? 0;
    if (!receipt || fee <= 0) return null;
    return `+ ${this.money(fee)} Paystack charge · ${this.money(receipt.amount + fee)} charged in all`;
  });

  readonly details = computed<IPaymentSuccessDetail[]>(() => {
    const receipt = this.receipt();
    if (!receipt) return [];
    const rows: IPaymentSuccessDetail[] = [{ label: 'Paid for', value: receipt.item.name }];
    if (receipt.department.name) rows.push({ label: 'Department', value: receipt.department.name });
    rows.push({ label: 'Paid on', value: longDate(receipt.paidAt) });
    rows.push({ label: 'Reference', value: receipt.reference, copyable: true });
    if (receipt.paymentMethod)
      rows.push({ label: 'Paid with', value: titleCase(receipt.paymentMethod) });
    return rows;
  });

  readonly standing = computed<IPaymentSuccessStanding | null>(() => {
    const standing = this.receipt()?.standing;
    if (!standing) return null;
    return {
      totalKobo: standing.totalKobo,
      paidKobo: standing.paidKobo,
      outstandingKobo: standing.outstandingKobo,
      settled: standing.settled,
      countLine:
        standing.instalmentsAllowed > 1
          ? `This was payment ${standing.paymentNumber} of up to ${standing.instalmentsAllowed}.`
          : null,
    };
  });

  /** School fees only: what this payment opened for course registration. */
  readonly unlocks = computed<IPaymentSuccessUnlock[]>(() => {
    const clearance = this.feesPage()?.clearance;
    if (!this.isSchoolFees() || !clearance) return [];
    return [
      {
        label: 'First semester',
        open: clearance.firstSemester.cleared,
        note: clearance.firstSemester.cleared
          ? 'Open — you can register your courses.'
          : clearance.firstSemester.reason,
      },
      {
        label: 'Second semester',
        open: clearance.secondSemester.cleared,
        note: clearance.secondSemester.cleared
          ? 'Open — your fees are paid in full.'
          : clearance.secondSemester.reason,
      },
    ];
  });

  readonly registrationOpen = computed(() => this.unlocks().some((unlock) => unlock.open));

  private readonly firstName = computed(() => {
    const full = this.receipt()?.payer.name ?? this.profile()?.student?.fullName ?? '';
    const first = full.trim().split(/\s+/)[0] ?? '';
    return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : '';
  });

  ngOnInit(): void {
    const reference = this.reference();
    if (!reference) {
      // Nothing to confirm — somebody opened the URL directly.
      this.router.navigate(['/payment-history']);
      return;
    }
    this.destroyRef.onDestroy(() => this.stopRechecking());
    this.verify();
  }

  /**
   * Ask the server, not the URL.
   *
   * The endpoint is scoped to the payer, so a reference pasted from someone
   * else's browser history answers 404 rather than confirming a stranger's
   * payment.
   */
  verify(manual = false): void {
    if (manual) {
      this.rechecks = 0;
      this.rechecksLeft.set(RECHECK_LIMIT);
      this.checking.set(true);
    }
    this.stopRechecking();
    this.failed.set(false);

    this.http
      .get<IAPIResponse<IVerifiedPayment>>(
        `${environment.BASE_URL}/transactions/verify/${encodeURIComponent(this.reference())}`
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.payment.set(resp.data);
          if (resp.data.status === 'COMPLETED') {
            this.loadDetails();
            return;
          }
          this.checking.set(false);
          if (resp.data.status === 'PENDING') this.recheckSoon();
        },
        error: () => {
          this.failed.set(true);
          this.checking.set(false);
        },
      });
  }

  /** The receipt — and, for school fees, what the payment opened. */
  private loadDetails(): void {
    // A payment that clears an overdue deadline opens a locked portal now.
    this.holds
      .refresh()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });

    this.payments
      .receipt(this.reference())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.receipt.set(resp.data);
          this.checking.set(false);
        },
        // The payment is confirmed either way; the page still says so.
        error: () => this.checking.set(false),
      });

    if (this.isSchoolFees()) {
      this.schoolFees
        .mine()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: (resp) => this.feesPage.set(resp.data), error: () => undefined });
    }
  }

  /** Paystack has the payment but has not confirmed it yet — ask again shortly. */
  private recheckSoon(): void {
    if (this.rechecks >= RECHECK_LIMIT) {
      this.rechecksLeft.set(0);
      return;
    }
    this.rechecks += 1;
    this.rechecksLeft.set(RECHECK_LIMIT - this.rechecks);
    this.recheckTimer = setTimeout(() => this.verify(), RECHECK_MS);
  }

  private stopRechecking(): void {
    if (this.recheckTimer) clearTimeout(this.recheckTimer);
    this.recheckTimer = null;
  }

  async downloadReceipt(): Promise<void> {
    const receipt = this.receipt();
    if (!receipt || this.downloading()) return;
    this.downloading.set(true);
    try {
      await this.exporter.download(receipt, this.institution());
    } catch {
      this.toast.showNotification(
        'error',
        'Could not prepare the receipt',
        'Try again, or download it from My payments.'
      );
    } finally {
      this.downloading.set(false);
    }
  }

  money(kobo: number | undefined): string {
    return formatNaira(kobo ?? 0);
  }
}

/** "21 October 2026 at 12:27 PM" — day first, as on the receipt. */
function longDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const months = [
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
  const hours = date.getHours();
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return (
    `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} ` +
    `at ${hour12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`
  );
}

/** `PAYSTACK` → `Paystack`. */
function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
