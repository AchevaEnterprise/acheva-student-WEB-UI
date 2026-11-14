import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { formatNaira } from '../../core/naira';

/** One line of "what this payment was". */
export interface IPaymentSuccessDetail {
  readonly label: string;
  readonly value: string;
  /** Set on the reference — offered with a copy button. */
  readonly copyable?: boolean;
}

/** Where the payment leaves the student, as at this payment. All KOBO. */
export interface IPaymentSuccessStanding {
  readonly totalKobo: number;
  readonly paidKobo: number;
  readonly outstandingKobo: number;
  readonly settled: boolean;
  /** "This was payment 1 of up to 3." — optional. */
  readonly countLine?: string | null;
}

/** Something the payment opened, or what is still needed to open it. */
export interface IPaymentSuccessUnlock {
  readonly label: string;
  readonly open: boolean;
  readonly note?: string | null;
}

/**
 * The page a student lands on after ANY payment (the user, 2026-11-11) —
 * dues or school fees paid on Paystack, or a bank/Remita receipt uploaded.
 * One layout so every payment ends the same way: what was paid, for what,
 * where it leaves them, what it opened, and a receipt that verifies.
 *
 * Presentational only. The page that owns the payment decides the words and
 * projects its own buttons into `[actions]`.
 */
@Component({
  selector: 'app-payment-success',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-success.html',
  styleUrl: './payment-success.scss',
})
export class PaymentSuccess {
  /** Small line above the title — "Departmental dues". */
  readonly eyebrow = input<string>('');
  readonly title = input.required<string>();
  readonly lead = input<string | null>(null);
  /** KOBO — the figure that counts toward what is owed. */
  readonly amountKobo = input.required<number>();
  /** Under the amount: Paystack's charge, or "Counted · being checked". */
  readonly amountNote = input<string | null>(null);
  readonly details = input<readonly IPaymentSuccessDetail[]>([]);
  readonly standing = input<IPaymentSuccessStanding | null>(null);
  readonly unlocks = input<readonly IPaymentSuccessUnlock[]>([]);
  /** The receipt's verify.acheva.app serial, when it has one. */
  readonly serial = input<string | null>(null);

  readonly copied = signal(false);

  readonly paidPercent = computed(() => {
    const standing = this.standing();
    if (!standing || standing.totalKobo <= 0) return 0;
    return Math.min(100, Math.round((standing.paidKobo / standing.totalKobo) * 100));
  });

  money(kobo: number): string {
    return formatNaira(kobo);
  }

  copy(value: string): void {
    void navigator.clipboard
      ?.writeText(value)
      .then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      })
      .catch(() => undefined);
  }
}
