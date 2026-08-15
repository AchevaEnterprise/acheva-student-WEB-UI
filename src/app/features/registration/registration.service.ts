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
  /**
   * How the line got here. `RECONCILIATION` means publish-time reconciliation
   * added or swapped it — the student never chose it themselves, so it is
   * badged in the table. `note` carries the reason.
   */
  readonly source: 'AUTO' | 'CA' | 'STUDENT' | 'RECONCILIATION';
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
  /** Courses excused in an earlier semester that must still be taken. */
  readonly excusedCourses: readonly IOutstandingExcusedCourse[];
}

/**
 * A course the student was excused from sitting. It did NOT affect their
 * CGPA — but it is still owed, and comes back in a later session as an
 * ordinary registration rather than a carry-over.
 */
export interface IOutstandingExcusedCourse {
  readonly courseId: string;
  readonly courseCode: string;
  readonly courseTitle: string;
  readonly units: number;
  readonly courseSemester: string;
  readonly originalType: 'COMPULSORY' | 'ELECTIVE' | 'SIWES' | 'CARRYOVER';
  readonly excusedInSession: string;
  readonly excusedInLevel: string;
  readonly excusedAt: string | null;
}

export interface ISelfRegistrationCourse {
  readonly courseId: string;
  readonly courseCode: string;
  readonly courseTitle: string;
  readonly units: number;
  readonly type: string;
}

/**
 * What the student is presented with when registering. Compulsory courses,
 * carry-overs and excused re-registrations are FIXED — only the elective
 * choices are theirs to make.
 */
export interface ISelfRegistrationOptions {
  readonly blocked: boolean;
  /** Present only when `blocked` — why they cannot register right now. */
  readonly reason?: string;
  readonly session?: string;
  readonly semester?: string;
  readonly level?: string;
  readonly deadline?: string | null;
  readonly minUnits?: number;
  readonly maxUnits?: number;
  readonly fixed?: readonly ISelfRegistrationCourse[];
  readonly carryOvers?: readonly {
    readonly courseId: string;
    readonly courseCode: string;
    readonly courseTitle: string;
    readonly units: number;
  }[];
  readonly excused?: readonly {
    readonly courseId: string;
    readonly courseCode: string;
    readonly courseTitle: string;
    readonly units: number;
  }[];
  readonly electiveGroups?: readonly {
    readonly group: string;
    readonly minRequired: number;
    readonly options: readonly ISelfRegistrationCourse[];
  }[];
  readonly optionalElectives?: readonly ISelfRegistrationCourse[];
}

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_URL}/registrations`;

  me(): Observable<IAPIResponse<IMyRegistration>> {
    return this.http.get<IAPIResponse<IMyRegistration>>(`${this.baseUrl}/me`);
  }

  /** What the student can register: fixed courses + elective choices. */
  options(): Observable<IAPIResponse<ISelfRegistrationOptions>> {
    return this.http.get<IAPIResponse<ISelfRegistrationOptions>>(`${this.baseUrl}/me/options`);
  }

  /** The student registers their own courses. */
  selfRegister(
    electiveCourseIds: string[]
  ): Observable<IAPIResponse<IMyRegistration['registration']>> {
    return this.http.post<IAPIResponse<IMyRegistration['registration']>>(`${this.baseUrl}/me`, {
      electiveCourseIds,
    });
  }

  editElectives(body: {
    add?: { courseId: string }[];
    drop?: { courseId: string }[];
  }): Observable<IAPIResponse<IMyRegistration>> {
    return this.http.patch<IAPIResponse<IMyRegistration>>(`${this.baseUrl}/me/electives`, body);
  }
}
