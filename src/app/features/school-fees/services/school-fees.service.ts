import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { IAPIResponse } from '../../../core/models/api-response.model';
import {
  IReceiptUpload,
  ISchoolFeeCheckout,
  ISchoolFeeReceipt,
  ISchoolFeesPage,
  PaymentChoice,
} from '../models/school-fees.model';

@Injectable({ providedIn: 'root' })
export class SchoolFeesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.BASE_URL}/school-fees`;

  /** My school fees for the active session, and my payments. */
  mine(): Observable<IAPIResponse<ISchoolFeesPage>> {
    return this.http.get<IAPIResponse<ISchoolFeesPage>>(`${this.base}/me`);
  }

  /**
   * Start a payment; returns the Paystack page to send the student to.
   * `amountKobo` goes with `AMOUNT` only — the server re-checks it.
   */
  pay(choice: PaymentChoice, amountKobo?: number): Observable<IAPIResponse<ISchoolFeeCheckout>> {
    return this.http.post<IAPIResponse<ISchoolFeeCheckout>>(`${this.base}/me/checkout`, {
      choice,
      ...(choice === 'AMOUNT' ? { amountKobo } : {}),
    });
  }

  /**
   * Upload the receipts for a payment made elsewhere — multipart, so the
   * browser sets the boundary; the server checks every field again.
   */
  uploadReceipt(upload: IReceiptUpload): Observable<IAPIResponse<ISchoolFeeReceipt>> {
    const form = new FormData();
    form.append('rrr', upload.rrr);
    form.append('amountKobo', String(upload.amountKobo));
    form.append('declaration', 'true');
    form.append('schoolFeeReceipt', upload.schoolFeeReceipt, upload.schoolFeeReceipt.name);
    form.append('remitaReceipt', upload.remitaReceipt, upload.remitaReceipt.name);
    return this.http.post<IAPIResponse<ISchoolFeeReceipt>>(`${this.base}/me/receipts`, form);
  }

  /** One of my receipt files, to open in a new tab. */
  receiptFile(id: string, which: 'schoolFeeReceipt' | 'remitaReceipt'): Observable<Blob> {
    return this.http.get(`${this.base}/receipts/${id}/files/${which}`, { responseType: 'blob' });
  }
}
