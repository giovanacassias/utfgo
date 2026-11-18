import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';

import { OtpChallenge, OtpPurpose, RegistrationData, User } from '../models/auth.model';

const API_URL = '/api';
const OTP_VALIDITY_MS = 10 * 60 * 1000;
const INSTITUTIONAL_EMAIL_ERROR = 'Informe um e-mail institucional da UTFPR.';
const NETWORK_ERROR = 'Não foi possível enviar o código. Verifique sua conexão e tente novamente.';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly currentChallenge = signal<OtpChallenge | null>(null);

  readonly pendingRegistration = signal<RegistrationData | null>(null);

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

  private normalizeEmail(email: string): string | null {
    const normalizedEmail = email.trim().toLowerCase();
    return this.isInstitutionalEmail(normalizedEmail) ? normalizedEmail : null;
  }
}
