import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { IAPIResponse } from '../../../core/models/api-response.model';
import { IDuesStandingPage, IPaymentStarted, PaymentChoice } from '../models/dues.model';

@Injectable({ providedIn: 'root' })
export class DuesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.BASE_URL}/transactions`;

  /**
   * My department's plan for a session, and where I stand on it.
   *
   * Omitting the session asks for the active one. The server validates any
   * session passed, so a student cannot ask about a future year.
   */
  standing(session?: string): Observable<IAPIResponse<IDuesStandingPage>> {
    const query = session ? `?session=${encodeURIComponent(session)}` : '';
    return this.http.get<IAPIResponse<IDuesStandingPage>>(`${this.base}/dues/my-standing${query}`);
  }

  /** Start a payment. Returns the provider link to send the student to. */
  pay(dueId: string, choice: PaymentChoice): Observable<IAPIResponse<IPaymentStarted>> {
    return this.http.post<IAPIResponse<IPaymentStarted>>(`${this.base}/dues/${dueId}`, { choice });
  }
}
