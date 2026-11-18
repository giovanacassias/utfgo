import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { routes } from '../../../../app.routes';
import { AuthService } from '../../../../core/auth/auth.service';

 describe('Register page', () => {
  let harness: RouterTestingHarness;
  const sendRegistrationOtp = vi.fn<AuthService['sendRegistrationOtp']>();
  const isInstitutionalEmail = (email: string) => /^[^@\s]+@(?:alunos\.utfpr\.edu\.br|utfpr\.edu\.br)$/i.test(email);
  beforeEach(async () => {
    sendRegistrationOtp.mockReset();
    TestBed.configureTestingModule({providers: [provideRouter(routes), {provide: AuthService, useValue: {sendRegistrationOtp, isInstitutionalEmail}}]});
    harness = await RouterTestingHarness.create('/criar-conta');
  });
  function fill(name: string, email: string, campus: string) {
    for (const [key, value] of Object.entries({name, email, campus})) {
      const input = harness.routeNativeElement!.querySelector<HTMLInputElement>(`#${key}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input', {bubbles: true}));
    }
  }
  async function submit() {
    harness.routeNativeElement!.querySelector('form')!.dispatchEvent(new SubmitEvent('submit', {bubbles: true, cancelable: true}));
    await Promise.resolve();
    await harness.fixture.whenStable();
  }
  it('blocks empty required fields with associated messages', async () => {
    await submit();
    expect(sendRegistrationOtp).not.toHaveBeenCalled();
    expect(harness.routeNativeElement!.textContent).toMatch(/nome completo/i);
    expect(harness.routeNativeElement!.querySelectorAll('[aria-invalid="true"]').length).toBe(3);
  });
  it('blocks an email outside the institutional allowlist', async () => {
    fill('Ana Silva', 'ana@gmail.com', 'Curitiba');
    await submit();
    expect(sendRegistrationOtp).not.toHaveBeenCalled();
    expect(harness.routeNativeElement!.querySelector('[role="alert"]')?.textContent).toMatch(/e-mail institucional da UTFPR/i);
  });
  it('explains a duplicate email', async () => {
    sendRegistrationOtp.mockReturnValue(throwError(() => new Error('Este e-mail já está cadastrado. Entre na sua conta.')));
    fill('Ana Silva', 'ana@utfpr.edu.br', 'Curitiba');
    await submit();
    expect(harness.routeNativeElement!.textContent).toMatch(/já está cadastrado.*entre na sua conta/i);
    expect(TestBed.inject(Router).url).toBe('/criar-conta');
  });
  it('sends registration data and advances after success', async () => {
    const data = {name: 'Ana Silva', email: 'ana@utfpr.edu.br', campus: 'Curitiba'};
    sendRegistrationOtp.mockReturnValue(of({email: data.email, code: '123456', expiresAt: '2030-01-01', purpose: 'REGISTRATION', registration: data}));
    fill(data.name, data.email, data.campus);
    await submit();
    expect(sendRegistrationOtp).toHaveBeenCalledWith(data);
    expect(TestBed.inject(Router).url).toBe('/validar-codigo');
  });
  it('retains inputs and allows retry after a network failure', async () => {
    sendRegistrationOtp.mockReturnValue(throwError(() => new Error('Não foi possível enviar o código. Verifique sua conexão e tente novamente.')));
    fill('Ana Silva', 'ana@utfpr.edu.br', 'Curitiba');
    await submit();
    expect(harness.routeNativeElement!.textContent).toMatch(/conexão/i);
    expect(harness.routeNativeElement!.querySelector<HTMLInputElement>('#name')!.value).toBe('Ana Silva');
    expect(harness.routeNativeElement!.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
  });
});

describe('Register page with AuthService', () => {
  it('retains pending registration data after navigating to code validation', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    const harness = await RouterTestingHarness.create('/criar-conta');
    const http = TestBed.inject(HttpTestingController);
    const data = {name: 'Ana Silva', email: 'ana@utfpr.edu.br', campus: 'Curitiba'};

    for (const [key, value] of Object.entries(data)) {
      const input = harness.routeNativeElement!.querySelector<HTMLInputElement>(`#${key}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input', {bubbles: true}));
    }
    harness.routeNativeElement!.querySelector('form')!.dispatchEvent(new SubmitEvent('submit', {bubbles: true, cancelable: true}));
    http.expectOne('/api/users?email=ana%40utfpr.edu.br').flush([]);
    http.expectOne('/api/auth/otp/send').flush({});
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/validar-codigo');
    expect(TestBed.inject(AuthService).pendingRegistration()).toEqual(data);
    http.verify();
  });
});
