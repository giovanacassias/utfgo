import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';

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

describe('AuthService — confirmação de OTP e sessão', () => {
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
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('confirms a valid login OTP and persists the authenticated session', async () => {
    const loginRequest = firstValueFrom(service.sendLoginOtp(activeUser.email));
    http.expectOne('/api/users?email=ana%40alunos.utfpr.edu.br').flush([activeUser]);
    const sendRequest = http.expectOne('/api/auth/otp/send');
    sendRequest.flush({ accepted: true });
    const challenge = await loginRequest;

    const confirmation = firstValueFrom(service.confirmOtp(challenge.code));
    http.expectOne('/api/users?email=ana%40alunos.utfpr.edu.br').flush([activeUser]);
    http.expectOne('/api/wallets?userId=user-1').flush([
      {
        id: 'wallet-1',
        userId: 'user-1',
        tokenBalance: 7,
        penaltyPoints: 0,
        updatedAt: '2026-10-02T00:00:00.000Z',
      },
    ]);
    const session = await confirmation;
    expect(session.wallet?.tokenBalance).toBe(7);

    expect(session.user).toEqual(activeUser);
    expect(session.token).toBeTruthy();
    expect(service.session()).toEqual(session);
    expect(JSON.parse(localStorage.getItem('utfgo.auth.session') ?? 'null')).toEqual(session);
  });

  it('confirms a valid registration OTP by creating the pending user and session', async () => {
    const registration = {
      name: 'Bia UTFPR',
      email: 'bia@utfpr.edu.br',
      campus: 'Pato Branco',
    };
    const registrationRequest = firstValueFrom(service.sendRegistrationOtp(registration));
    http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([]);
    const sendRequest = http.expectOne('/api/auth/otp/send');
    sendRequest.flush({ accepted: true });
    const challenge = await registrationRequest;

    const confirmation = firstValueFrom(service.confirmOtp(challenge.code));
    const createRequest = http.expectOne('/api/users');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toMatchObject({
      ...registration,
      role: 'PASSENGER',
      status: 'ACTIVE',
    });
    createRequest.flush(createRequest.request.body);

    const walletRequest = http.expectOne('/api/wallets');
    expect(walletRequest.request.body).toMatchObject({
      userId: createRequest.request.body.id,
      tokenBalance: 0,
      penaltyPoints: 0,
    });
    walletRequest.flush({ id: 'wallet-2', ...walletRequest.request.body });
    const session = await confirmation;

    expect(session.user).toEqual({
      id: createRequest.request.body.id,
      ...registration,
      role: 'PASSENGER',
      status: 'ACTIVE',
    });
    expect(service.session()).toEqual(session);
  });

  it('does not save a partial session if wallet creation fails', async () => {
    const request = firstValueFrom(
      service.sendRegistrationOtp({ name: 'Bia', email: 'bia@utfpr.edu.br', campus: 'Curitiba' }),
    );
    http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([]);
    http.expectOne('/api/auth/otp/send').flush({});
    const challenge = await request;
    const confirmation = firstValueFrom(service.confirmOtp(challenge.code));
    const create = http.expectOne('/api/users');
    const user = create.request.body;
    create.flush(user);
    http.expectOne('/api/wallets').error(new ProgressEvent('error'));
    await expect(confirmation).rejects.toThrow();
    expect(service.session()).toBeNull();
    expect(localStorage.getItem('utfgo.auth.session')).toBeNull();

    const retry = firstValueFrom(service.confirmOtp(challenge.code));
    http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([user]);
    http.expectOne(`/api/wallets?userId=${user.id}`).flush([
      {
        id: 'wallet-2',
        userId: user.id,
        tokenBalance: 0,
        penaltyPoints: 0,
        updatedAt: '2026-01-01',
      },
    ]);
    expect((await retry).wallet?.userId).toBe(user.id);
  });

  it('resumes registration after wallet creation fails and the service restarts', async () => {
    const registration = { name: 'Bia', email: 'bia@utfpr.edu.br', campus: 'Curitiba' };
    const request = firstValueFrom(service.sendRegistrationOtp(registration));
    http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([]);
    http.expectOne('/api/auth/otp/send').flush({});
    const challenge = await request;
    const confirmation = firstValueFrom(service.confirmOtp(challenge.code));
    const create = http.expectOne('/api/users');
    const user = create.request.body;
    create.flush(user);
    http.expectOne('/api/wallets').error(new ProgressEvent('error'));
    await expect(confirmation).rejects.toThrow();
    expect(service.session()).toBeNull();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    const resumed = firstValueFrom(service.sendRegistrationOtp(registration));
    http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([user]);
    http.expectOne('/api/auth/otp/send').flush({});
    const newChallenge = await resumed;
    const retry = firstValueFrom(service.confirmOtp(newChallenge.code));
    http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([user]);
    http.expectOne(`/api/wallets?userId=${user.id}`).flush([]);
    const wallet = http.expectOne('/api/wallets');
    wallet.flush({ id: 'wallet-recovery', ...wallet.request.body });
    expect((await retry).user).toEqual(user);
    expect(service.pendingRegistration()).toBeNull();
  });

  it('records recovery before the wallet request completes', async () => {
    const registration = { name: 'Bia', email: 'bia@utfpr.edu.br', campus: 'Curitiba' };
    const request = firstValueFrom(service.sendRegistrationOtp(registration));
    http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([]);
    http.expectOne('/api/auth/otp/send').flush({});
    const challenge = await request;
    const subscription = service.confirmOtp(challenge.code).subscribe();
    const create = http.expectOne('/api/users');
    const user = create.request.body;
    create.flush(user);
    expect(
      JSON.parse(
        localStorage.getItem('utfgo.auth.registration-recovery.bia%40utfpr.edu.br') ?? 'null',
      ),
    ).toEqual(user);
    subscription.unsubscribe();
    http.expectOne('/api/wallets');
  });

  it('recovers a user when the response to user creation is lost', async () => {
    const registration = { name: 'Bia', email: 'bia@utfpr.edu.br', campus: 'Curitiba' };
    const request = firstValueFrom(service.sendRegistrationOtp(registration));
    http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([]);
    http.expectOne('/api/auth/otp/send').flush({});
    const challenge = await request;
    const confirmation = firstValueFrom(service.confirmOtp(challenge.code));
    const create = http.expectOne('/api/users');
    const persisted = create.request.body;
    expect(persisted.id).toBeTruthy();
    create.error(new ProgressEvent('error'));
    await expect(confirmation).rejects.toThrow();
    const retry = firstValueFrom(service.confirmOtp(challenge.code));
    http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([persisted]);
    http.expectOne(`/api/wallets?userId=${persisted.id}`).flush([]);
    const wallet = http.expectOne('/api/wallets');
    wallet.flush({ id: 'wallet', ...wallet.request.body });
    expect((await retry).user.id).toBe(persisted.id);
  });

  it('keeps recovery records for different registrations independent', async () => {
    const first = { name: 'Bia', email: 'bia@utfpr.edu.br', campus: 'Curitiba' };
    const second = { name: 'Ana', email: 'ana@utfpr.edu.br', campus: 'Pato Branco' };
    const start = async (registration: RegistrationData) => {
      const request = firstValueFrom(service.sendRegistrationOtp(registration));
      http.expectOne(`/api/users?email=${encodeURIComponent(registration.email)}`).flush([]);
      http.expectOne('/api/auth/otp/send').flush({});
      const challenge = await request;
      const confirmation = firstValueFrom(service.confirmOtp(challenge.code));
      const create = http.expectOne('/api/users');
      const user = create.request.body;
      create.error(new ProgressEvent('error'));
      await expect(confirmation).rejects.toThrow();
      return user;
    };
    const firstUser = await start(first);
    await start(second);
    const restart = firstValueFrom(service.sendRegistrationOtp(first));
    http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([firstUser]);
    http.expectOne('/api/auth/otp/send').flush({});
    await expect(restart).resolves.toBeDefined();
  });

  it('uses the same wallet id for simultaneous confirmations of one registration', async () => {
    const registration = { name: 'Bia', email: 'bia@utfpr.edu.br', campus: 'Curitiba' };
    const request = firstValueFrom(service.sendRegistrationOtp(registration));
    http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([]);
    http.expectOne('/api/auth/otp/send').flush({});
    const challenge = await request;
    const first = firstValueFrom(service.confirmOtp(challenge.code));
    const create = http.expectOne('/api/users');
    const user = create.request.body;
    create.flush(user);
    const firstWallet = http.expectOne('/api/wallets');
    const second = firstValueFrom(service.confirmOtp(challenge.code));
    http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([user]);
    http.expectOne(`/api/wallets?userId=${user.id}`).flush([]);
    const secondWallet = http.expectOne('/api/wallets');
    expect(firstWallet.request.body.id).toBeTruthy();
    expect(secondWallet.request.body.id).toBe(firstWallet.request.body.id);
    secondWallet.error(new ProgressEvent('error'));
    await expect(second).rejects.toThrow();
    firstWallet.flush(firstWallet.request.body);
    await first;
  });

  it.each(['SUSPENDED', 'BANNED'] as const)(
    'does not authenticate a recovered %s account',
    async (status) => {
      const registration = { name: 'Bia', email: 'bia@utfpr.edu.br', campus: 'Curitiba' };
      const request = firstValueFrom(service.sendRegistrationOtp(registration));
      http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([]);
      http.expectOne('/api/auth/otp/send').flush({});
      const challenge = await request;
      const confirmation = firstValueFrom(service.confirmOtp(challenge.code));
      const create = http.expectOne('/api/users');
      const user = create.request.body;
      create.flush(user);
      http.expectOne('/api/wallets').error(new ProgressEvent('error'));
      await expect(confirmation).rejects.toThrow();
      const retry = firstValueFrom(service.confirmOtp(challenge.code));
      http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([{ ...user, status }]);
      await expect(retry).rejects.toThrow(status === 'BANNED' ? 'banida' : 'suspensa');
      expect(service.session()).toBeNull();
    },
  );

  it('does not trust role or status in a recovered user', async () => {
    const registration = { name: 'Bia', email: 'bia@utfpr.edu.br', campus: 'Curitiba' };
    localStorage.setItem('utfgo.auth.registration-recovery.bia%40utfpr.edu.br', JSON.stringify({ ...registration, id: 'old', role: 'ADMIN', status: 'BANNED' }));
    const request = firstValueFrom(service.sendRegistrationOtp(registration));
    http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([]);
    http.expectOne('/api/auth/otp/send').flush({});
    const challenge = await request;
    const confirmation = firstValueFrom(service.confirmOtp(challenge.code));
    http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([]);
    const create = http.expectOne('/api/users');
    expect(create.request.body).toMatchObject({ role: 'PASSENGER', status: 'ACTIVE' });
    create.flush(create.request.body);
    const wallet = http.expectOne('/api/wallets');
    wallet.flush(wallet.request.body);
    await confirmation;
  });

  it('creates a missing wallet during login after browser data is cleared', async () => {
    const login = firstValueFrom(service.sendLoginOtp(activeUser.email));
    http.expectOne('/api/users?email=ana%40alunos.utfpr.edu.br').flush([activeUser]);
    http.expectOne('/api/auth/otp/send').flush({});
    const challenge = await login;
    const confirmation = firstValueFrom(service.confirmOtp(challenge.code));
    http.expectOne('/api/users?email=ana%40alunos.utfpr.edu.br').flush([activeUser]);
    http.expectOne('/api/wallets?userId=user-1').flush([]);
    const wallet = http.expectOne('/api/wallets');
    wallet.flush(wallet.request.body);
    expect((await confirmation).wallet?.userId).toBe(activeUser.id);
  });

  it('allows changed registration data when the previous user was not persisted', async () => {
    const old = { id: 'old', name: 'Bia', email: 'bia@utfpr.edu.br', campus: 'Curitiba', role: 'ADMIN', status: 'BANNED' };
    localStorage.setItem('utfgo.auth.registration-recovery.bia%40utfpr.edu.br', JSON.stringify(old));
    const request = firstValueFrom(service.sendRegistrationOtp({ ...old, campus: 'Londrina' }));
    http.expectOne('/api/users?email=bia%40utfpr.edu.br').flush([]);
    http.expectOne('/api/auth/otp/send').flush({});
    const challenge = await request;
    const confirmation = firstValueFrom(service.confirmOtp(challenge.code));
    const create = http.expectOne('/api/users');
    expect(create.request.body).toMatchObject({ campus: 'Londrina', role: 'PASSENGER', status: 'ACTIVE' });
    create.flush(create.request.body);
    const wallet = http.expectOne('/api/wallets');
    wallet.flush(wallet.request.body);
    await confirmation;
  });

  it('rejects an incomplete OTP without authenticating or creating a session', async () => {
    const loginRequest = firstValueFrom(service.sendLoginOtp(activeUser.email));
    http.expectOne('/api/users?email=ana%40alunos.utfpr.edu.br').flush([activeUser]);
    http.expectOne('/api/auth/otp/send').flush({ accepted: true });
    await loginRequest;

    await expect(firstValueFrom(service.confirmOtp('12345'))).rejects.toThrow(
      'O código deve ter 6 dígitos.',
    );
    expect(service.session()).toBeNull();
    expect(localStorage.getItem('utfgo.auth.session')).toBeNull();
  });

  it('rejects an incorrect OTP without authenticating or creating a session', async () => {
    const loginRequest = firstValueFrom(service.sendLoginOtp(activeUser.email));
    http.expectOne('/api/users?email=ana%40alunos.utfpr.edu.br').flush([activeUser]);
    const sendRequest = http.expectOne('/api/auth/otp/send');
    sendRequest.flush({ accepted: true });
    const challenge = await loginRequest;

    const invalidCode = challenge.code === '000000' ? '111111' : '000000';
    await expect(firstValueFrom(service.confirmOtp(invalidCode))).rejects.toThrow(
      'O código informado é inválido.',
    );
    expect(service.session()).toBeNull();
    expect(localStorage.getItem('utfgo.auth.session')).toBeNull();
  });

  it('rejects an expired OTP without authenticating or creating a session', async () => {
    const loginRequest = firstValueFrom(service.sendLoginOtp(activeUser.email));
    http.expectOne('/api/users?email=ana%40alunos.utfpr.edu.br').flush([activeUser]);
    const sendRequest = http.expectOne('/api/auth/otp/send');
    sendRequest.flush({ accepted: true });
    const challenge = await loginRequest;
    vi.spyOn(Date, 'now').mockReturnValue(new Date(challenge.expiresAt).getTime());

    await expect(firstValueFrom(service.confirmOtp(challenge.code))).rejects.toThrow(
      'Este código expirou. Solicite um novo.',
    );
    expect(service.session()).toBeNull();
    expect(localStorage.getItem('utfgo.auth.session')).toBeNull();
  });

  it('restores a persisted session when the service is instantiated again', () => {
    const session = {
      user: activeUser,
      token: 'token-restaurado',
      wallet: {
        id: 'wallet-1',
        userId: 'user-1',
        tokenBalance: 7,
        penaltyPoints: 0,
        updatedAt: '2026-10-02T00:00:00.000Z',
      },
    };
    localStorage.setItem('utfgo.auth.session', JSON.stringify(session));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });

    expect(TestBed.inject(AuthService).session()).toEqual(session);
  });

  it('rejects an old session without a wallet instead of displaying a fabricated balance', () => {
    localStorage.setItem(
      'utfgo.auth.session',
      JSON.stringify({ user: activeUser, token: 'old-token' }),
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    expect(TestBed.inject(AuthService).session()).toBeNull();
  });

  it('ignores an invalid persisted session when the service is instantiated', () => {
    localStorage.setItem('utfgo.auth.session', JSON.stringify({}));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });

    expect(TestBed.inject(AuthService).session()).toBeNull();
  });

  it('invalidates a pending OTP when logging out', async () => {
    const loginRequest = firstValueFrom(service.sendLoginOtp(activeUser.email));
    http.expectOne('/api/users?email=ana%40alunos.utfpr.edu.br').flush([activeUser]);
    const sendRequest = http.expectOne('/api/auth/otp/send');
    sendRequest.flush({ accepted: true });
    const challenge = await loginRequest;

    service.logout();

    const confirmation = firstValueFrom(service.confirmOtp(challenge.code));
    expect(http.match('/api/users?email=ana%40alunos.utfpr.edu.br')).toHaveLength(0);
    await expect(confirmation).rejects.toThrow('Solicite um código antes de confirmar.');
    expect(service.session()).toBeNull();
  });

  it('clears the session from memory and localStorage on logout', async () => {
    const loginRequest = firstValueFrom(service.sendLoginOtp(activeUser.email));
    http.expectOne('/api/users?email=ana%40alunos.utfpr.edu.br').flush([activeUser]);
    const sendRequest = http.expectOne('/api/auth/otp/send');
    sendRequest.flush({ accepted: true });
    const challenge = await loginRequest;
    const confirmation = firstValueFrom(service.confirmOtp(challenge.code));
    http.expectOne('/api/users?email=ana%40alunos.utfpr.edu.br').flush([activeUser]);
    http.expectOne('/api/wallets?userId=user-1').flush([
      {
        id: 'wallet-1',
        userId: 'user-1',
        tokenBalance: 0,
        penaltyPoints: 0,
        updatedAt: '2026-10-02T00:00:00.000Z',
      },
    ]);
    await confirmation;

    service.logout();

    expect(service.session()).toBeNull();
    expect(localStorage.getItem('utfgo.auth.session')).toBeNull();
  });
});
