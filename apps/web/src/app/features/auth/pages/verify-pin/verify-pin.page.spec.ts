import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { routes } from '../../../../app.routes';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthSession, OtpChallenge } from '../../../../core/models/auth.model';

const session: AuthSession = { token: 'token', user: { id: '1', name: 'Ana', email: 'ana@utfpr.edu.br', campus: 'Curitiba', role: 'PASSENGER', status: 'ACTIVE' } };
const challenge: OtpChallenge = { email: session.user.email, code: '123456', expiresAt: '2030-01-01T00:00:00Z', purpose: 'LOGIN' };

describe('Verify PIN page', () => {
  let harness: RouterTestingHarness;
  const state = signal<AuthSession | null>(null);
  const confirmOtp = vi.fn<AuthService['confirmOtp']>();
  const resendOtp = vi.fn<AuthService['resendOtp']>();
  beforeEach(async () => {
    state.set(null); confirmOtp.mockReset(); resendOtp.mockReset();
    TestBed.configureTestingModule({ providers: [provideRouter(routes), { provide: AuthService, useValue: { session: state, confirmOtp, resendOtp, logout: vi.fn() } }] });
    harness = await RouterTestingHarness.create();
    await TestBed.inject(Router).navigateByUrl('/validar-codigo', { state: { email: session.user.email } });
    await harness.fixture.whenStable();
  });
  function input(code: string) {
    const field = harness.routeNativeElement!.querySelector('input') as HTMLInputElement;
    field.value = code; field.dispatchEvent(new Event('input', { bubbles: true }));
  }
  async function submit() {
    (harness.routeNativeElement!.querySelector('form') as HTMLFormElement).dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve(); await harness.fixture.whenStable();
  }
  it('shows the email and rejects an incomplete code', async () => {
    expect(harness.routeNativeElement?.textContent).toContain(session.user.email);
    input('123'); await submit();
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toMatch(/6 dígitos/i);
    expect(confirmOtp).not.toHaveBeenCalled();
  });
  it.each(['O código informado é inválido.', 'Este código expirou. Solicite um novo.', 'Não foi possível enviar o código. Verifique sua conexão e tente novamente.'])('displays the confirmation error %s and preserves the code', async (message) => {
    confirmOtp.mockReturnValue(throwError(() => new Error(message)));
    input('123456'); await submit();
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain(message);
    expect((harness.routeNativeElement?.querySelector('input') as HTMLInputElement).value).toBe('123456');
  });
  it('resends the code and displays confirmation', async () => {
    resendOtp.mockReturnValue(of(challenge));
    const button = Array.from(harness.routeNativeElement!.querySelectorAll('button')).find((item) => item.textContent?.includes('Reenviar código'))!;
    button.click(); await Promise.resolve(); await harness.fixture.whenStable();
    expect(resendOtp).toHaveBeenCalledOnce();
    expect(harness.routeNativeElement?.querySelector('[role="status"]')?.textContent).toMatch(/reenviado/i);
  });
  it('keeps the entered code when resending fails and allows retry', async () => {
    resendOtp.mockReturnValueOnce(throwError(() => new Error('Verifique sua conexão e tente novamente.'))).mockReturnValueOnce(of(challenge));
    input('123456');
    const button = Array.from(harness.routeNativeElement!.querySelectorAll('button')).find((item) => item.textContent?.includes('Reenviar código'))!;
    button.click(); await Promise.resolve(); await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toMatch(/conexão/i);
    expect((harness.routeNativeElement?.querySelector('input') as HTMLInputElement).value).toBe('123456');
    button.click(); await Promise.resolve(); await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.querySelector('[role="status"]')?.textContent).toMatch(/reenviado/i);
  });
  it('opens the authenticated shell with the user greeting after confirmation', async () => {
    confirmOtp.mockImplementation(() => { state.set(session); return of(session); });
    input('123456'); await submit();
    expect(confirmOtp).toHaveBeenCalledWith('123456');
    expect(TestBed.inject(Router).url).toBe('/inicio');
    expect(harness.routeNativeElement?.matches('app-shell')).toBe(true);
    expect(harness.routeNativeElement?.textContent).toContain('Olá, Ana');
  });
});
