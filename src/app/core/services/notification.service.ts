import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IAPIResponse } from '../models/api-response.model';
import { INotification } from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly notificationUrl = `${environment.BASE_URL}/notifications`;

  getNotifications(): Observable<IAPIResponse<INotification[]>> {
    return this.http.get<IAPIResponse<INotification[]>>(`${this.notificationUrl}`);
  }

  createNotification(notification: {
    title: string;
    message: string;
    type: string;
    recipientId: string;
    data?: unknown;
  }): Observable<IAPIResponse<unknown>> {
    return this.http.post<IAPIResponse<unknown>>(`${this.notificationUrl}`, notification);
  }

  markAsRead(notificationId: string): Observable<IAPIResponse<unknown>> {
    return this.http.patch<IAPIResponse<unknown>>(
      `${this.notificationUrl}/${notificationId}/read`,
      {}
    );
  }
}
