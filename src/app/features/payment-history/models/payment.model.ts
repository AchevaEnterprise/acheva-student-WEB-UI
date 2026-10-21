/**
 * Payments a student has made, and the receipt each completed one produces.
 *
 * Every amount here is **KOBO**, the integer minor unit, exactly as the
 * server sends it. Nothing in this file holds naira, and nothing divides by
 * 100 — `formatNaira` in `core/naira.ts` is the one place the two meet.
 */

/** What the money was for. Dues run against a plan; a transcript fee does not. */
export type PaymentPurpose = 'DUES' | 'TRANSCRIPT' | 'PAYMENT';

export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REJECTED'
  | 'REVERSED'
  | 'REFUNDED'
  | 'CANCELLED';

/** What a payment was against — a dues plan, or a one-off fee. */
export interface IPaymentItem {
  readonly name: string;
  readonly session: string | null;
}

export interface IPaymentDepartment {
  readonly name: string | null;
  readonly code: string | null;
}

/** One row in the history list. */
export interface IPaymentRow {
  readonly reference: string;
  readonly purpose: PaymentPurpose;
  readonly description: string;
  /** KOBO. */
  readonly amount: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly paidAt: string | null;
  readonly createdAt: string | null;
  readonly item: IPaymentItem;
  readonly department: IPaymentDepartment;
  /**
   * Only COMPLETED payments have receipts. A pending attempt is not proof of
   * anything, and a document saying otherwise is one a student could wave at
   * a bursar.
   */
  readonly receiptAvailable: boolean;
}

export interface IPaymentHistoryPage {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly items: IPaymentRow[];
}

/**
 * Where a dues payment left the student, as at the moment it was made.
 *
 * `null` on anything that is not against a dues plan — a transcript fee has
 * no balance to run down, and printing "₦0 outstanding" there would invent a
 * debt that never existed.
 */
export interface IReceiptStanding {
  /** KOBO. */
  readonly totalKobo: number;
  readonly paidKobo: number;
  readonly outstandingKobo: number;
  /**
   * Which payment this was — payments MADE, not instalments scheduled.
   * Clearing the whole plan in one transfer is payment 1, not 3.
   */
  readonly paymentNumber: number;
  readonly instalmentsAllowed: number;
  readonly settled: boolean;
}

export interface IReceiptPayer {
  readonly name: string | null;
  readonly registrationNumber: string | null;
  readonly email: string | null;
}

export interface IPaymentReceipt {
  readonly reference: string;
  readonly issuedAt: string;
  readonly paidAt: string;
  readonly description: string;
  readonly purpose: PaymentPurpose;
  /** KOBO. */
  readonly amount: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly paymentMethod: string | null;
  readonly payer: IReceiptPayer;
  readonly department: IPaymentDepartment;
  readonly item: IPaymentItem;
  readonly standing: IReceiptStanding | null;
}
