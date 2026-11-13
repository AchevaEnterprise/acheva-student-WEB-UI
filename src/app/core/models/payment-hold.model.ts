/**
 * A missed payment deadline that has the portal locked to paying it
 * (2026-11-11). Mirrors `StudentPaymentHold` in acheva-nestjs.
 */
export interface IPaymentHold {
  readonly kind: 'DUES' | 'SCHOOL_FEES';
  readonly session: string;
  /** "School fees 2025/2026". */
  readonly label: string;
  /** The deadline that was missed. */
  readonly deadline: string;
  /** KOBO. */
  readonly outstandingKobo: number;
  /** KOBO — the least the overdue payment may be. */
  readonly minimumKobo: number;
  readonly since: string;
}
