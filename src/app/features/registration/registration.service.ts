import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IAPIResponse } from '../../core/models/api-response.model';

export interface IRegistrationEntry {
  readonly _id: string;
  readonly course: string;
  readonly courseCode: string;
  readonly courseTitle: string;
  readonly units: number;
  readonly type: 'COMPULSORY' | 'ELECTIVE' | 'SIWES' | 'CARRYOVER';
  readonly status: 'REGISTERED' | 'DROPPED';
  readonly electiveGroup: string | null;
  readonly note: string | null;
}

export interface IMyRegistration {
  readonly registration: {
    readonly _id: string;
    readonly session: string;
    readonly semester: string;
    readonly level: string;
    readonly status: 'ACTIVE' | 'PENDING_CA_APPROVAL' | 'NEEDS_ATTENTION';
    readonly totalUnits: number;
    readonly nonSiwesUnits: number;
    readonly entries: IRegistrationEntry[];
  } | null;
  readonly settings: {
    readonly activeSession: string;
    readonly activeSemester: string;
    readonly registrationGraceDays: number;
  } | null;
  readonly grace: {
    readonly editableUntil: string;
    readonly daysLeft: number;
    readonly canEdit: boolean;
  } | null;
  readonly electiveOptions: readonly {
    readonly course: { _id: string; courseCode: string; courseTitle: string };
    readonly units: number;
    readonly electiveGroup: string | null;
  }[];
}

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_URL}/registrations`;

  me(): Observable<IAPIResponse<IMyRegistration>> {
    return this.http.get<IAPIResponse<IMyRegistration>>(`${this.baseUrl}/me`);
  }

  editElectives(body: {
    add?: { courseId: string }[];
    drop?: { courseId: string }[];
  }): Observable<IAPIResponse<IMyRegistration>> {
    return this.http.patch<IAPIResponse<IMyRegistration>>(`${this.baseUrl}/me/electives`, body);
  }
}
