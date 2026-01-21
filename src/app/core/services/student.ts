import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IAPIResponse } from '../models/api-response.model';
import { LevelsEnum, SemesterEnum } from '../models/school.model';
import {
  IStudentAnalytics,
  IStudentPerformance,
  IStudentProfile,
  IStudentResult,
  IStudentSessionsResult,
} from '../models/student.model';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly studentUrl = `${environment.BASE_URL}/students`;

  getProfile(): Observable<IAPIResponse<IStudentProfile>> {
    return this.http.get<IAPIResponse<IStudentProfile>>(`${this.studentUrl}/profile`);
  }

  getAnalytics(): Observable<IAPIResponse<IStudentAnalytics>> {
    return this.http.get<IAPIResponse<IStudentAnalytics>>(`${this.studentUrl}/analytics`);
  }

  getPerformance(
    session: string,
    semester: SemesterEnum
  ): Observable<IAPIResponse<IStudentPerformance[]>> {
    let params = new HttpParams();
    if (session) params = params.append('session', session);
    if (semester) params = params.append('semester', semester);

    return this.http.get<IAPIResponse<IStudentPerformance[]>>(`${this.studentUrl}/performance`, {
      params,
    });
  }

  getMyResult(): Observable<IAPIResponse<IStudentResult>> {
    return this.http.get<IAPIResponse<IStudentResult>>(`${this.studentUrl}/my-results`);
  }

  getResults(
    level: LevelsEnum,
    session: string,
    semester: SemesterEnum
  ): Observable<IAPIResponse<IStudentResult>> {
    let params = new HttpParams();
    if (level) params = params.append('level', level);
    if (session) params = params.append('session', session);
    if (semester) params = params.append('semester', semester);

    return this.http.get<IAPIResponse<IStudentResult>>(`${this.studentUrl}/results`, { params });
  }

  getResultsBySessions(): Observable<IAPIResponse<IStudentSessionsResult[]>> {
    return this.http.get<IAPIResponse<IStudentSessionsResult[]>>(`${this.studentUrl}/sessions`);
  }
}
