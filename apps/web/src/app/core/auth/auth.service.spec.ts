import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { RegistrationData, User } from '../models/auth.model';

describe('AuthService — envio de OTP', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const activeUser: User = {
    id: 'user-1',
    name: 'Ana UTFPR',
    email: 'ana@alunos.utfpr.edu.br',
    campus: 'Curitiba',
    role: 'PASSENGER',
    status: 'ACTIVE',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('accepts only the institutional allowlist for login and registration', () => {
    expect(service.isInstitutionalEmail('ana@alunos.utfpr.edu.br')).toBe(true);
    expect(service.isInstitutionalEmail('servidor@utfpr.edu.br')).toBe(true);
    expect(service.isInstitutionalEmail('ana@gmail.com')).toBe(false);
    expect(service.isInstitutionalEmail('ana@aluno.utfpr.edu.br')).toBe(false);
    expect(service.isInstitutionalEmail('')).toBe(false);
  });

  it('blocks an invalid login email without making an API request', async () => {
    await expect(firstValueFrom(service.sendLoginOtp('ana@gmail.com'))).rejects.toThrow(
      'Informe um e-mail institucional da UTFPR.',
    );
  });

  it('blocks registration without a name or with a duplicate email', async () => {
    const registration: RegistrationData = {
      name: '',
      email: 'ana@alunos.utfpr.edu.br',
      campus: 'Curitiba',
    };

    await expect(firstValueFrom(service.sendRegistrationOtp(registration))).rejects.toThrow(
      'Informe seu nome completo.',
    );

    const duplicate: RegistrationData = {
      name: 'Ana UTFPR',
      email: activeUser.email,
      campus: 'Curitiba',
    };
    const request = firstValueFrom(service.sendRegistrationOtp(duplicate));
    const lookup = http.expectOne('/api/users?email=ana%40alunos.utfpr.edu.br');
    lookup.flush([activeUser]);

    await expect(request).rejects.toThrow('Este e-mail já está cadastrado. Entre na sua conta.');
  });

  it('does not overwrite pending registration data when the email is duplicated', async () => {
    const pending: RegistrationData = {
      name: 'Bia UTFPR',
      email: 'bia@utfpr.edu.br',
      campus: 'Pato Branco',
    };
    const firstRequest = firstValueFrom(service.sendRegistrationOtp(pending));
    http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([]);
    const firstSend = http.expectOne('/api/auth/otp/send');
    firstSend.flush({ accepted: true });
    await firstRequest;

    const duplicateRequest = firstValueFrom(
      service.sendRegistrationOtp({
        name: 'Outra Pessoa',
        email: activeUser.email,
        campus: 'Curitiba',
      }),
    );
    http.expectOne('/api/users?email=ana%40alunos.utfpr.edu.br').flush([activeUser]);

    await expect(duplicateRequest).rejects.toThrow(
      'Este e-mail já está cadastrado. Entre na sua conta.',
    );
    expect(service.pendingRegistration()).toEqual(pending);
  });

  it('blocks login when the institutional email is not registered', async () => {
    const request = firstValueFrom(service.sendLoginOtp('novo@utfpr.edu.br'));
    const lookup = http.expectOne('/api/users?email=novo%40utfpr.edu.br');
    lookup.flush([]);

    await expect(request).rejects.toThrow('E-mail não cadastrado. Crie uma conta primeiro.');
  });

  it.each(['SUSPENDED', 'BANNED'] as const)('blocks login for a %s account', async (status) => {
    const request = firstValueFrom(service.sendLoginOtp(activeUser.email));
    const lookup = http.expectOne('/api/users?email=ana%40alunos.utfpr.edu.br');
    lookup.flush([{ ...activeUser, status }]);

    await expect(request).rejects.toThrow(
      status === 'SUSPENDED' ? 'Sua conta está suspensa.' : 'Sua conta está banida.',
    );
  });

  it('generates a six-digit OTP valid for ten minutes for an active login', async () => {
    const request = firstValueFrom(service.sendLoginOtp(activeUser.email));
    const lookup = http.expectOne('/api/users?email=ana%40alunos.utfpr.edu.br');
    lookup.flush([activeUser]);

    const send = http.expectOne('/api/auth/otp/send');
    expect(send.request.method).toBe('POST');
    expect(send.request.body.email).toBe(activeUser.email);
    expect(send.request.body.code).toMatch(/^\d{6}$/);
    expect(new Date(send.request.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(new Date(send.request.body.expiresAt).getTime()).toBeLessThanOrEqual(
      Date.now() + 10 * 60 * 1000,
    );
    send.flush({ accepted: true });

    const challenge = await request;
    expect(challenge.code).toBe(send.request.body.code);
    expect(challenge.email).toBe(activeUser.email);
  });

  it('keeps registration data pending while sending its OTP', async () => {
    const registration: RegistrationData = {
      name: 'Bia UTFPR',
      email: 'bia@utfpr.edu.br',
      campus: 'Pato Branco',
    };
    const request = firstValueFrom(service.sendRegistrationOtp(registration));
    http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([]);
    const send = http.expectOne('/api/auth/otp/send');
    send.flush({ accepted: true });

    await request;
    expect(service.pendingRegistration()).toEqual(registration);
  });

  it('generates a new OTP and restarts its ten-minute validity on resend', async () => {
    const first = firstValueFrom(service.sendLoginOtp(activeUser.email));
    http.expectOne('/api/users?email=ana%40alunos.utfpr.edu.br').flush([activeUser]);
    const firstSend = http.expectOne('/api/auth/otp/send');
    firstSend.flush({ accepted: true });
    const firstChallenge = await first;

    const resend = firstValueFrom(service.resendOtp());
    const resendRequest = http.expectOne('/api/auth/otp/send');
    expect(resendRequest.request.body.email).toBe(activeUser.email);
    expect(resendRequest.request.body.code).toMatch(/^\d{6}$/);
    expect(resendRequest.request.body.code).not.toBe(firstChallenge.code);
    resendRequest.flush({ accepted: true });

    const resentChallenge = await resend;
    expect(resentChallenge.code).not.toBe(firstChallenge.code);
    expect(new Date(resentChallenge.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('returns a friendly network error and preserves registration data', async () => {
    const registration: RegistrationData = {
      name: 'Carlos UTFPR',
      email: 'carlos@alunos.utfpr.edu.br',
      campus: 'Londrina',
    };
    const request = firstValueFrom(service.sendRegistrationOtp(registration));
    http.expectOne('/api/users?email=carlos%40alunos.utfpr.edu.br').flush([]);
    http.expectOne('/api/auth/otp/send').error(new ProgressEvent('error'));

    await expect(request).rejects.toThrow(
      'Não foi possível enviar o código. Verifique sua conexão e tente novamente.',
    );
    expect(service.pendingRegistration()).toEqual(registration);
  });

  it('preserves the previous pending registration when the duplicate lookup fails', async () => {
    const pending: RegistrationData = {
      name: 'Duda UTFPR',
      email: 'duda@utfpr.edu.br',
      campus: 'Dois Vizinhos',
    };
    const firstRequest = firstValueFrom(service.sendRegistrationOtp(pending));
    http.expectOne('/api/users?email=duda%40utfpr.edu.br').flush([]);
    http.expectOne('/api/auth/otp/send').flush({ accepted: true });
    await firstRequest;

    const failedRequest = firstValueFrom(
      service.sendRegistrationOtp({
        name: 'Nova Pessoa',
        email: 'novo@utfpr.edu.br',
        campus: 'Curitiba',
      }),
    );
    http.expectOne('/api/users?email=novo%40utfpr.edu.br').error(new ProgressEvent('error'));

    await expect(failedRequest).rejects.toThrow(
      'Não foi possível enviar o código. Verifique sua conexão e tente novamente.',
    );
    expect(service.pendingRegistration()).toEqual(pending);
  });
});
