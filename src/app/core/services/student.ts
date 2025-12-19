import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IAPIResponse } from '../models/api-response.model';
import { LevelsEnum } from '../models/school.model';
import { IStudentAnalytics, IStudentProfile, IStudentResult } from '../models/student.model';

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

  getResults(level: LevelsEnum, session: string): Observable<IAPIResponse<IStudentResult>> {
    let params = new HttpParams();
    params = params.append('level', level);
    params = params.append('session', session);

    return this.http.get<IAPIResponse<IStudentResult>>(`${this.studentUrl}/results`, { params });
  }
}
