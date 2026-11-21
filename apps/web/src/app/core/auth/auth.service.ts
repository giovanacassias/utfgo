import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';

import {
  AuthSession,
  OtpChallenge,
  OtpPurpose,
  RegistrationData,
  User,
  Wallet,
} from '../models/auth.model';

import { INSTITUTIONAL_EMAIL_DOMAINS } from './institutional-email.config';

const API_URL = '/api';
const OTP_VALIDITY_MS = 10 * 60 * 1000;
const SESSION_STORAGE_KEY = 'utfgo.auth.session';
const RECOVERY_STORAGE_KEY = 'utfgo.auth.registration-recovery';
const INSTITUTIONAL_EMAIL_ERROR = 'Informe um e-mail institucional da UTFPR.';
const NETWORK_ERROR = 'Não foi possível enviar o código. Verifique sua conexão e tente novamente.';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly institutionalDomains = new Set(
    inject(INSTITUTIONAL_EMAIL_DOMAINS).map((domain) => domain.trim().toLowerCase()),
  );
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
        switchMap((user) =>
          this.http.get<Wallet[]>(`${API_URL}/wallets?userId=${encodeURIComponent(user.id)}`).pipe(
            catchError(() => throwError(() => new Error(NETWORK_ERROR))),
            switchMap((wallets) =>
              wallets[0]
                ? this.authenticate(user, wallets[0])
                : this.createWallet(user),
            ),
          ),
        ),
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

    const storedRecovery = this.registrationRecovery(registration.email);
    const recovery = storedRecovery && {
      id: storedRecovery.id,
      ...registration,
      role: 'PASSENGER' as const,
      status: 'ACTIVE' as const,
    };
    if (recovery && recovery.email === registration.email) {
      return this.findUsersByEmail(registration.email).pipe(
        switchMap((users) => {
          const user = users.find((candidate) => candidate.id === recovery.id);
          if (!user) {
            if (users.length)
              return throwError(
                () => new Error('Este e-mail já está cadastrado. Entre na sua conta.'),
              );
            return this.createRegistrationUser(recovery);
          }
          this.requireLoginUser([user]);
          return this.http
            .get<Wallet[]>(`${API_URL}/wallets?userId=${encodeURIComponent(user.id)}`)
            .pipe(
              catchError(() => throwError(() => new Error(NETWORK_ERROR))),
              switchMap((wallets) =>
                wallets[0] ? this.authenticate(user, wallets[0], true) : this.createWallet(user),
              ),
            );
        }),
      );
    }

    const newUser: User = { ...userData, id: crypto.randomUUID() };
    localStorage.setItem(this.recoveryKey(newUser.email), JSON.stringify(newUser));
    return this.createRegistrationUser(newUser);
  }

  private createRegistrationUser(userData: User): Observable<AuthSession> {
    return this.http.post<User>(`${API_URL}/users`, userData).pipe(
      catchError(() => throwError(() => new Error(NETWORK_ERROR))),
      switchMap((user) => {
        return this.createWallet(user);
      }),
    );
  }

  private createWallet(user: User): Observable<AuthSession> {
    return this.http
      .post<Wallet>(`${API_URL}/wallets`, {
        id: `wallet-${user.id}`,
        userId: user.id,
        tokenBalance: 0,
        penaltyPoints: 0,
        updatedAt: new Date().toISOString(),
      })
      .pipe(
        catchError(() => throwError(() => new Error(NETWORK_ERROR))),
        switchMap((wallet) => this.authenticate(user, wallet, true)),
      );
  }

  logout(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.currentChallenge.set(null);
    this.pendingRegistration.set(null);
    this.sessionState.set(null);
  }

  isInstitutionalEmail(email: string): boolean {
    const domain = /^[^\s@]+@([^\s@]+)$/.exec(email.trim().toLowerCase())?.[1];
    return domain !== undefined && this.institutionalDomains.has(domain);
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
        const recovery = this.registrationRecovery(registration.email);
        if (!users.length && recovery &&
          (recovery.name !== registration.name || recovery.campus !== registration.campus)) {
          localStorage.removeItem(this.recoveryKey(registration.email));
        }
        if (
          users.length > 0 &&
          !(
            users.length === 1 &&
            recovery?.id === users[0].id &&
            recovery.email === registration.email &&
            recovery.name === registration.name &&
            recovery.campus === registration.campus
          )
        ) {
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

  private authenticate(
    user: User,
    wallet: Wallet,
    clearPendingRegistration = false,
  ): Observable<AuthSession> {
    const session: AuthSession = {
      user,
      wallet,
      token: `utfgo-session-${user.id}`,
    };
    this.sessionState.set(session);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    this.currentChallenge.set(null);
    if (clearPendingRegistration) {
      this.pendingRegistration.set(null);
      localStorage.removeItem(this.recoveryKey(user.email));
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

  private recoveryKey(email: string): string {
    return `${RECOVERY_STORAGE_KEY}.${encodeURIComponent(email)}`;
  }

  private registrationRecovery(email: string): User | null {
    try {
      const value = JSON.parse(
        localStorage.getItem(this.recoveryKey(email)) ?? 'null',
      ) as User | null;
      return value &&
        typeof value.id === 'string' &&
        typeof value.email === 'string' &&
        typeof value.name === 'string' &&
        typeof value.campus === 'string'
        ? value
        : null;
    } catch {
      return null;
    }
  }

  private isAuthSession(value: unknown): value is AuthSession {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<AuthSession>;
    const user = candidate.user;
    const wallet = candidate.wallet;
    return (
      typeof candidate.token === 'string' &&
      !!user &&
      typeof user === 'object' &&
      typeof user.id === 'string' &&
      typeof user.name === 'string' &&
      typeof user.email === 'string' &&
      typeof user.campus === 'string' &&
      !!wallet &&
      typeof wallet.id === 'string' &&
      wallet.userId === user.id &&
      typeof wallet.tokenBalance === 'number' &&
      typeof wallet.penaltyPoints === 'number' &&
      typeof wallet.updatedAt === 'string' &&
      ['PASSENGER', 'DRIVER', 'ADMIN'].includes(user.role ?? '') &&
      ['ACTIVE', 'SUSPENDED', 'BANNED'].includes(user.status ?? '')
    );
  }

  private normalizeEmail(email: string): string | null {
    const normalizedEmail = email.trim().toLowerCase();
    return this.isInstitutionalEmail(normalizedEmail) ? normalizedEmail : null;
  }
}
