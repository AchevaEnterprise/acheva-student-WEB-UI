import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { IAPIResponse } from '../models/api-response.model';
import { IPaymentHold } from '../models/payment-hold.model';

/** How long a known answer is trusted before the guard asks again. */
const FRESH_MS = 60_000;

/**
 * Whether a missed payment deadline has this student's portal locked
 * (2026-11-11), and to which pages.
 *
 * The server keeps the lock and refuses everything else (`PAYMENT_HOLD`);
 * this only keeps the portal from offering what would be refused. Asked on
 * the way into the shell, and again after a payment so the portal opens the
 * moment the money lands.
 */
@Injectable({ providedIn: 'root' })
export class PaymentHoldsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.BASE_URL}/payment-holds`;
  private checkedAt = 0;

  readonly holds = signal<readonly IPaymentHold[] | null>(null);
  readonly locked = computed(() => (this.holds() ?? []).length > 0);

  /** The shell's pages a locked student may still open: paying what they owe. */
  readonly openRoutes = computed(() => {
    const kinds = new Set((this.holds() ?? []).map((hold) => hold.kind));
    return [
      ...(kinds.has('SCHOOL_FEES') ? ['school-fees'] : []),
      ...(kinds.has('DUES') ? ['dues'] : []),
    ];
  });

  /** Ask the server — it works the lock out afresh. */
  refresh(): Observable<readonly IPaymentHold[]> {
    return this.http.get<IAPIResponse<{ holds: IPaymentHold[] }>>(`${this.base}/me`).pipe(
      map((resp) => resp.data?.holds ?? []),
      tap((holds) => {
        this.holds.set(holds);
        this.checkedAt = Date.now();
      })
    );
  }

  /** The known answer while it is fresh, else a new one. */
  current(): Observable<readonly IPaymentHold[]> {
    const known = this.holds();
    return known && Date.now() - this.checkedAt < FRESH_MS ? of(known) : this.refresh();
  }

  /** May a locked student open this URL? The lock page and paying, only. */
  isOpen(url: string): boolean {
    const path = url.split(/[?#]/)[0];
    if (path === '/payment-required' || path.startsWith('/dues/complete')) return true;
    return this.openRoutes().some((route) => path === `/${route}` || path.startsWith(`/${route}/`));
  }

  /** Forget — on sign-out, so the next student starts clean. */
  clear(): void {
    this.holds.set(null);
    this.checkedAt = 0;
  }
}
