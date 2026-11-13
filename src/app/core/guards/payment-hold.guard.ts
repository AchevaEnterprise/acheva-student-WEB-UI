import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { PaymentHoldsService } from '../services/payment-holds';

/**
 * A student whose payment deadline passed unpaid is kept to paying it
 * (2026-11-11): every page in the shell except the payment pages for what
 * they owe sends them to `/payment-required`. The server refuses the rest
 * anyway; this keeps the portal from offering it. A failed check lets them
 * through — a network blip must not lock anyone out.
 */
export const paymentHoldGuard: CanActivateChildFn = (_route, state) => {
  const holds = inject(PaymentHoldsService);
  const router = inject(Router);
  return holds.current().pipe(
    map((list) =>
      list.length > 0 && !holds.isOpen(state.url)
        ? router.createUrlTree(['/payment-required'])
        : true
    ),
    catchError(() => of(true))
  );
};
