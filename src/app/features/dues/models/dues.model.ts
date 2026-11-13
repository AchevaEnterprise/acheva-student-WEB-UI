/**
 * Departmental dues, as a student sees them.
 *
 * Mirrors `acheva-nestjs/src/dues/` and the standing endpoint in
 * `transactions`. Every amount is KOBO — see `core/naira.ts` for the only
 * place it meets naira.
 */

export type DuesStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'INACTIVE';

/** Nothing paid · part paid · settled. Not a boolean, deliberately. */
export type DuesPaymentStatus = 'NOT_STARTED' | 'PARTIAL' | 'PAID';

export interface IDuesInstalment {
  readonly position: number;
  readonly amount: number;
  readonly dueDate: string;
  readonly note: string | null;
}

export interface IDuesPlan {
  readonly id: string;
  readonly session: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly totalAmount: number;
  readonly instalments: readonly IDuesInstalment[];
  readonly status: DuesStatus;
}

/**
 * What the next payment may be. The student chooses the amount (2026-11-09):
 * at least `minimumKobo` (30% of the total, or what is left), at most what is
 * owed, and exactly the balance when `mustClear` — the last allowed payment.
 */
export interface INextPayment {
  readonly number: number;
  readonly of: number;
  readonly minimumKobo: number;
  readonly maximumKobo: number;
  readonly suggestedKobo: number;
  readonly mustClear: boolean;
  readonly dueDate: string | null;
}

export interface IDuesStanding {
  readonly totalKobo: number;
  readonly paidKobo: number;
  readonly outstandingKobo: number;
  /** How many payments were made. Paying everything at once is 1. */
  readonly paymentsMade: number;
  readonly paymentsAllowed: number;
  readonly status: DuesPaymentStatus;
  readonly nextPayment: INextPayment | null;
  readonly nextInstalment: {
    readonly position: number;
    readonly amount: number;
    readonly dueDate: string;
  } | null;
}

export interface IDuesPayment {
  readonly reference: string;
  readonly amount: number;
  readonly paidAt: string;
}

export interface IDuesStandingPage {
  /** The session being viewed — defaults to the active one. */
  readonly session: string;
  readonly activeSession: string;
  /** Newest first, back to the first session Acheva ran. */
  readonly selectableSessions: readonly string[];
  /** Set once the student has graduated: nothing is owed after this session. */
  readonly graduatedSession?: string | null;
  /** Set while their final results are not all out: nothing is owed after this session. */
  readonly awaitingResultsFor?: string | null;
  readonly config: IDuesPlan | null;
  readonly standing: IDuesStanding | null;
  readonly payments: readonly IDuesPayment[];
}

/**
 * What a student chose to pay. `AMOUNT` carries their own figure, which the
 * server checks against the same rules this page shows.
 */
export type PaymentChoice = 'FULL' | 'NEXT_INSTALMENT' | 'AMOUNT';

export interface IPaymentStarted {
  readonly paymentLink: string;
  /** An earlier checkout was still open — this link goes back to it (2026-11-11). */
  readonly resumed?: boolean;
  /** …and Paystack says it went through: the link is its success page. */
  readonly alreadyPaid?: boolean;
  /** KOBO — the resumed payment's amount. */
  readonly amount?: number;
}
