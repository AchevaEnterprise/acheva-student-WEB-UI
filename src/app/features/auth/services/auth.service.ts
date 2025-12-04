import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IAPIResponse } from '../../../core/models/api-response.model';
import { STORAGE_KEYS } from '../../../core/models/storage.model';
import {
  IAccessRefreshToken,
  IAccount,
  IAuthProfile,
  ILogIn,
  IResetPassword,
  ISignUp,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly jwtHelper: JwtHelperService = new JwtHelperService();

  private readonly authUrl = `${environment.BASE_URL}/auth`;
  private readonly baseUrl = `${environment.BASE_URL}`;

  activeAccount = signal<Partial<IAccount> | null>(null);

  setToken(token: string) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }

  get getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  setRefreshToken(refreshToken: string) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  get getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  public get isAuthenticated(): boolean {
    const token = this.getToken;

    if (token && !this.jwtHelper.isTokenExpired(token)) return true;
    return false;
  }

  public signIn(payload: ILogIn): Observable<IAPIResponse<IAuthProfile>> {
    return this.http
      .post<IAPIResponse<IAuthProfile>>(`${this.authUrl}/students/signin`, payload)
      .pipe(
        tap((resp) => {
          const { accessToken, refreshToken, ...rest } = resp.data;

          this.setToken(accessToken);
          this.setRefreshToken(refreshToken);

          this.activeAccount.set(rest);
          localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, JSON.stringify(this.activeAccount()));
        })
      );
  }

  public signUp(payload: ISignUp): Observable<IAPIResponse<unknown>> {
    return this.http.post<IAPIResponse<unknown>>(`${this.authUrl}/students/register`, payload);
  }

  loadInitialSession() {
    const account = localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT);
    if (account) this.activeAccount.set(JSON.parse(account));
  }

  public getProfile() {
    const userId = this.jwtHelper.decodeToken(this.getToken!)._id;
    return this.http.get<IAPIResponse<IAuthProfile>>(`${this.baseUrl}/students/${userId}`).pipe(
      tap((resp) => {
        if (resp.status) {
          this.activeAccount.set(resp.data);
          localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, JSON.stringify(this.activeAccount()));
        }
      })
    );
  }

  forgotPassword(email: string): Observable<IAPIResponse<unknown>> {
    return this.http.post<IAPIResponse<unknown>>(
      `${this.authUrl}/forgot-password`,
      { email },
      { params: { accountType: 'STUDENT' } }
    );
  }

  resendEmailVerification(email: string): Observable<IAPIResponse<unknown>> {
    return this.http.post<IAPIResponse<unknown>>(
      `${this.authUrl}/resend-email-verification`,
      { email },
      { params: { accountType: 'LECTURER' } }
    );
  }

  confirmCode(accountId: string, token: string): Observable<IAPIResponse<{ token: string }>> {
    return this.http.patch<IAPIResponse<{ token: string }>>(
      `${this.authUrl}/verify-email/${accountId}`,
      { token }
    );
  }

  resetPassword(payload: IResetPassword): Observable<IAPIResponse<unknown>> {
    return this.http.patch<IAPIResponse<unknown>>(`${this.authUrl}/reset-password`, { payload });
  }

  refreshToken(refreshToken: string): Observable<IAPIResponse<IAccessRefreshToken>> {
    return this.http.post<IAPIResponse<IAccessRefreshToken>>(
      `${this.authUrl}/students/refresh-token`,
      { refreshToken }
    );
  }

  logOut() {
    localStorage.clear();
    this.router.navigate(['auth']);
  }
}
