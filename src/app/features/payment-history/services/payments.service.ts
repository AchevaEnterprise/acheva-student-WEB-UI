import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { IAPIResponse } from '../../../core/models/api-response.model';
import { IPaymentHistoryPage, IPaymentReceipt } from '../models/payment.model';

/**
 * The student's own payments.
 *
 * Both routes are scoped to the token server-side — there is no student id
 * in either path, so there is nothing on this side to tamper with, and a
 * reference belonging to somebody else comes back 404 rather than 403.
 */
@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.BASE_URL}/transactions`;

  /** Everything I have paid or tried to pay, newest first. */
  history(page = 1, limit = 20): Observable<IAPIResponse<IPaymentHistoryPage>> {
    return this.http.get<IAPIResponse<IPaymentHistoryPage>>(
      `${this.base}/mine?page=${page}&limit=${limit}`
    );
  }

  /** The receipt for one completed payment. 404 unless it is mine and paid. */
  receipt(reference: string): Observable<IAPIResponse<IPaymentReceipt>> {
    return this.http.get<IAPIResponse<IPaymentReceipt>>(
      `${this.base}/${encodeURIComponent(reference)}/receipt`
    );
  }
}
