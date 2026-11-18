import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';

import {
  AuthSession,
  OtpChallenge,
  OtpPurpose,
  RegistrationData,
  User,
} from '../models/auth.model';

const API_URL = '/api';
const OTP_VALIDITY_MS = 10 * 60 * 1000;
const SESSION_STORAGE_KEY = 'utfgo.auth.session';
const INSTITUTIONAL_EMAIL_ERROR = 'Informe um e-mail institucional da UTFPR.';
const NETWORK_ERROR = 'Não foi possível enviar o código. Verifique sua conexão e tente novamente.';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly currentChallenge = signal<OtpChallenge | null>(null);
  private readonly sessionState = signal<AuthSession | null>(this.restoreSession());

  readonly pendingRegistration = signal<RegistrationData | null>(null);
  readonly session = this.sessionState.asReadonly();

  confirmOtp(code: string): Observable<AuthSession> {
    const challenge = this.currentChallenge();
    if (!challenge) {
      return throwError(() => new Error('Solicite um código antes de confirmar.'));
    }
    if (code.length !== 6) {
      return throwError(() => new Error('O código deve ter 6 dígitos.'));
    }
    if (Date.now() >= new Date(challenge.expiresAt).getTime()) {
      return throwError(() => new Error('Este código expirou. Solicite um novo.'));
    }
    if (code !== challenge.code) {
      return throwError(() => new Error('O código informado é inválido.'));
    }

    if (challenge.purpose === 'LOGIN') {
      return this.findUsersByEmail(challenge.email).pipe(
        map((users) => this.requireLoginUser(users)),
        switchMap((user) => this.authenticate(user)),
      );
    }

    const registration = this.pendingRegistration();
    if (!registration) {
      return throwError(() => new Error('Os dados do cadastro não estão mais disponíveis.'));
    }

    const userData = {
      ...registration,
      role: 'PASSENGER' as const,
      status: 'ACTIVE' as const,
    };

    return this.http.post<User>(`${API_URL}/users`, userData).pipe(
      catchError(() => throwError(() => new Error(NETWORK_ERROR))),
      switchMap((user) => this.authenticate(user, true)),
    );
  }

  logout(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.currentChallenge.set(null);
    this.pendingRegistration.set(null);
    this.sessionState.set(null);
  }

  isInstitutionalEmail(email: string): boolean {
    const normalizedEmail = email.trim().toLowerCase();
    return /^[^\s@]+@(?:alunos\.utfpr\.edu\.br|utfpr\.edu\.br)$/.test(normalizedEmail);
  }

  sendLoginOtp(email: string): Observable<OtpChallenge> {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) {
      return throwError(() => new Error(INSTITUTIONAL_EMAIL_ERROR));
    }

    return this.findUsersByEmail(normalizedEmail).pipe(
      map((users) => this.requireLoginUser(users)),
      map((user) => this.createChallenge(user.email, 'LOGIN')),
      this.dispatchChallenge(),
    );
  }

  sendRegistrationOtp(data: RegistrationData): Observable<OtpChallenge> {
    const name = data.name.trim();
    const normalizedEmail = this.normalizeEmail(data.email);
    const campus = data.campus.trim();

    if (!name) {
      return throwError(() => new Error('Informe seu nome completo.'));
    }
    if (!normalizedEmail) {
      return throwError(() => new Error(INSTITUTIONAL_EMAIL_ERROR));
    }
    if (!campus) {
      return throwError(() => new Error('Informe seu câmpus.'));
    }

    const registration: RegistrationData = {
      name,
      email: normalizedEmail,
      campus,
    };

    return this.findUsersByEmail(registration.email).pipe(
      map((users) => {
        if (users.length > 0) {
          throw new Error('Este e-mail já está cadastrado. Entre na sua conta.');
        }
        this.pendingRegistration.set(registration);
        return this.createChallenge(registration.email, 'REGISTRATION', registration);
      }),
      this.dispatchChallenge(),
    );
  }

  resendOtp(): Observable<OtpChallenge> {
    const previousChallenge = this.currentChallenge();
    if (!previousChallenge) {
      return throwError(() => new Error('Solicite um código antes de reenviar.'));
    }

    const challenge = this.createChallenge(
      previousChallenge.email,
      previousChallenge.purpose,
      previousChallenge.registration,
      previousChallenge.code,
    );
    return this.sendChallenge(challenge);
  }

  private findUsersByEmail(email: string): Observable<User[]> {
    return this.http
      .get<User[]>(`${API_URL}/users?email=${encodeURIComponent(email)}`)
      .pipe(catchError(() => throwError(() => new Error(NETWORK_ERROR))));
  }

  private requireLoginUser(users: User[]): User {
    const user = users[0];
    if (!user) {
      throw new Error('E-mail não cadastrado. Crie uma conta primeiro.');
    }
    if (user.status === 'SUSPENDED') {
      throw new Error('Sua conta está suspensa.');
    }
    if (user.status === 'BANNED') {
      throw new Error('Sua conta está banida.');
    }
    return user;
  }

  private createChallenge(
    email: string,
    purpose: OtpPurpose,
    registration?: RegistrationData,
    previousCode?: string,
  ): OtpChallenge {
    let code = this.generateOtp();
    while (code === previousCode) {
      code = this.generateOtp();
    }

    return {
      email,
      code,
      expiresAt: new Date(Date.now() + OTP_VALIDITY_MS).toISOString(),
      purpose,
      ...(registration ? { registration } : {}),
    };
  }

  private generateOtp(): string {
    return Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');
  }

  private dispatchChallenge() {
    return switchMap((challenge: OtpChallenge) => this.sendChallenge(challenge));
  }

  private sendChallenge(challenge: OtpChallenge): Observable<OtpChallenge> {
    return this.http.post(`${API_URL}/auth/otp/send`, challenge).pipe(
      map(() => {
        this.currentChallenge.set(challenge);
        return challenge;
      }),
      catchError(() => throwError(() => new Error(NETWORK_ERROR))),
    );
  }

  private authenticate(user: User, clearPendingRegistration = false): Observable<AuthSession> {
    const session: AuthSession = {
      user,
      token: `utfgo-session-${user.id}`,
    };
    this.sessionState.set(session);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    this.currentChallenge.set(null);
    if (clearPendingRegistration) {
      this.pendingRegistration.set(null);
    }
    return of(session);
  }

  private restoreSession(): AuthSession | null {
    const serializedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!serializedSession) {
      return null;
    }

    try {
      const parsedSession: unknown = JSON.parse(serializedSession);
      return this.isAuthSession(parsedSession) ? parsedSession : null;
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  private isAuthSession(value: unknown): value is AuthSession {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<AuthSession>;
    const user = candidate.user;
    return (
      typeof candidate.token === 'string' &&
      !!user &&
      typeof user === 'object' &&
      typeof user.id === 'string' &&
      typeof user.name === 'string' &&
      typeof user.email === 'string' &&
      typeof user.campus === 'string' &&
      ['PASSENGER', 'DRIVER', 'ADMIN'].includes(user.role ?? '') &&
      ['ACTIVE', 'SUSPENDED', 'BANNED'].includes(user.status ?? '')
    );
  }

  private normalizeEmail(email: string): string | null {
    const normalizedEmail = email.trim().toLowerCase();
    return this.isInstitutionalEmail(normalizedEmail) ? normalizedEmail : null;
  }
}
