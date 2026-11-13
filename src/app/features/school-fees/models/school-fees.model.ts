import { IDuesStanding, PaymentChoice } from '../../dues/models/dues.model';

/**
 * School fees, as a student sees them — `GET /school-fees/me` (2026-11-09).
 *
 * Acheva sets the fee per department × level × option; the student pays it
 * in the plan's 1–3 payments on the same 30% rule as dues, so the standing
 * has the dues shape exactly. Every amount is KOBO.
 */

export interface ISchoolFeeClearance {
  readonly cleared: boolean;
  /** Why not, in words they can act on. */
  readonly reason: string | null;
}

export interface ISchoolFeeScheduleRow {
  readonly position: number;
  readonly dueDate: string;
  readonly note: string | null;
  readonly suggestedKobo: number;
}

export interface ISchoolFeePayment {
  readonly reference: string;
  readonly amount: number;
  /** Paystack's charge paid on top of `amount`. */
  readonly processingFeeKobo?: number;
  readonly status: string;
  readonly session: string | null;
  readonly createdAt: string | null;
  readonly paidAt: string | null;
}

export interface ISchoolFeesPage {
  readonly session: string | null;
  readonly activeSemester: string | null;
  readonly fee: {
    readonly department: string | null;
    /** The level whose fee applies — the final one in extra year. */
    readonly level: string | null;
    readonly standingLabel: string;
    readonly option: string | null;
    readonly totalKobo: number;
  } | null;
  /** Why there is nothing to pay, when there is not. */
  readonly reason: string | null;
  readonly standing: IDuesStanding | null;
  readonly schedule: readonly ISchoolFeeScheduleRow[];
  readonly clearance?: {
    readonly firstSemester: ISchoolFeeClearance;
    readonly secondSemester: ISchoolFeeClearance;
  };
  /** False while the university cannot receive payments through Acheva. */
  readonly payable?: boolean;
  /** Paystack's pricing — the student pays the charge on top (2026-11-10). */
  readonly paystackPricing?: IPaystackPricing;
  /** Whether a receipt for a payment made elsewhere may be uploaded now. */
  readonly canUploadReceipt?: boolean;
  readonly receipts?: readonly ISchoolFeeReceipt[];
  readonly payments: readonly ISchoolFeePayment[];
}

export interface IPaystackPricing {
  readonly perMille: number;
  readonly flatKobo: number;
  readonly flatWaivedBelowKobo: number;
  readonly capKobo: number;
}

/**
 * A payment made outside Acheva, proved by its receipts. It counts toward
 * the fees as soon as it is uploaded and is checked later.
 */
export interface ISchoolFeeReceipt {
  readonly _id: string;
  readonly rrr: string;
  readonly amount: number;
  readonly session: string;
  readonly status: 'UNCHECKED' | 'VERIFIED' | 'REJECTED';
  /** Why a rejected one was refused. */
  readonly reason: string | null;
  readonly uploadedAt: string | null;
}

/** The text half of a receipt upload; the two files go alongside. */
export interface IReceiptUpload {
  readonly rrr: string;
  readonly amountKobo: number;
  readonly schoolFeeReceipt: File;
  readonly remitaReceipt: File;
}

export interface ISchoolFeeCheckout {
  readonly reference: string;
  readonly paymentLink: string;
  readonly amount: number;
  readonly processingFeeKobo: number;
  readonly totalKobo: number;
  /** An earlier checkout was still open — this link goes back to it (2026-11-11). */
  readonly resumed?: boolean;
  /** …and Paystack says it went through: the link is its success page. */
  readonly alreadyPaid?: boolean;
}

export type { PaymentChoice };
