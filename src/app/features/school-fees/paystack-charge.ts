import { IPaystackPricing } from './models/school-fees.model';

/**
 * Paystack's charge on an online school-fee payment, which the student pays
 * on top (2026-11-10). A copy of `acheva-nestjs/src/school-fees/utils/
 * paystack-charge.ts` — the repos share no package — run on the pricing the
 * API sends, so the figures shown are the figures charged. All KOBO.
 */
export function paystackChargeOn(totalKobo: number, pricing: IPaystackPricing): number {
  const percentPart = Math.ceil((totalKobo * pricing.perMille) / 1000);
  const flat = totalKobo < pricing.flatWaivedBelowKobo ? 0 : pricing.flatKobo;
  return Math.min(percentPart + flat, pricing.capKobo);
}

/** The total to charge so that `amountKobo` reaches the university in full. */
export function grossUpForPaystack(
  amountKobo: number,
  pricing: IPaystackPricing
): { totalKobo: number; chargeKobo: number } {
  let total = amountKobo;
  for (let step = 0; step < 20; step += 1) {
    const next = amountKobo + paystackChargeOn(total, pricing);
    if (next === total) break;
    total = next;
  }
  while (total - paystackChargeOn(total, pricing) < amountKobo) total += 1;
  return { totalKobo: total, chargeKobo: total - amountKobo };
}
