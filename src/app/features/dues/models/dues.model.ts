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

export interface IDuesStanding {
  readonly totalKobo: number;
  readonly paidKobo: number;
  readonly outstandingKobo: number;
  /** How many payments were made. Paying everything at once is 1. */
  readonly paymentsMade: number;
  readonly status: DuesPaymentStatus;
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
  readonly config: IDuesPlan | null;
  readonly standing: IDuesStanding | null;
  readonly payments: readonly IDuesPayment[];
}

/**
 * What a student chose to pay — a CHOICE, never an amount.
 *
 * The server derives the figure from the plan and what is already paid.
 * Sending an amount would be sending a price a student picked themselves.
 */
export type PaymentChoice = 'FULL' | 'NEXT_INSTALMENT';

export interface IPaymentStarted {
  readonly paymentLink: string;
}
