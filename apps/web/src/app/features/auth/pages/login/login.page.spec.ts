import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { routes } from '../../../../app.routes';
import { AuthService } from '../../../../core/auth/auth.service';
import { OtpChallenge } from '../../../../core/models/auth.model';

const loginChallenge: OtpChallenge = {
  email: 'ana@alunos.utfpr.edu.br',
  code: '123456',
  expiresAt: '2030-01-01T12:00:00.000Z',
  purpose: 'LOGIN',
};

describe('Login page', () => {
  let harness: RouterTestingHarness;
  const isInstitutionalEmail = vi.fn<AuthService['isInstitutionalEmail']>();
  const sendLoginOtp = vi.fn<AuthService['sendLoginOtp']>();

  beforeEach(async () => {
    isInstitutionalEmail.mockReset().mockReturnValue(true);
    sendLoginOtp.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: { isInstitutionalEmail, sendLoginOtp } },
      ],
    });
    harness = await RouterTestingHarness.create('/entrar');
    await harness.fixture.whenStable();
  });

  it('provides a labeled institutional email field and a code submission button', () => {
    const page = harness.routeNativeElement;
    const email = page?.querySelector<HTMLInputElement>('input[type="email"]');
    const submit = page?.querySelector('button[type="submit"]');

    expect(email?.labels?.[0]?.textContent.trim()).toBe('E-mail institucional');
    expect(submit?.textContent?.trim()).toBe('Enviar código de acesso');
  });

  it('provides an accessible back control and explains that login uses a one-time PIN', () => {
    const page = harness.routeNativeElement;
    const back = page?.querySelector('a[aria-label="Voltar"]');

    expect(back?.getAttribute('href')).toBe('/');
    expect(page?.querySelector('form')?.textContent).toMatch(/código PIN de uso único/i);
  });

  it('limits the login form container to the theme small breakpoint', () => {
    const formContainer = harness.routeNativeElement?.querySelector('form')?.parentElement;

    expect(Array.from(formContainer?.classList ?? [])).toContain('max-w-(--breakpoint-sm)');
  });

  it.each([
    { kind: 'an empty address', value: '', institutional: true },
    { kind: 'a malformed address', value: 'pessoa@@utfpr.edu.br', institutional: true },
    { kind: 'an outside domain', value: 'pessoa@gmail.com', institutional: false },
    {
      kind: 'a similar outside domain',
      value: 'pessoa@utfpr.edu.br.example',
      institutional: false,
    },
  ])(
    'blocks $kind and associates a validation message with the field',
    async ({ value, institutional }) => {
      isInstitutionalEmail.mockReturnValue(institutional);
      const email = fillEmail(value);
      submitForm();
      await harness.fixture.whenStable();

      const descriptionId = email.getAttribute('aria-describedby');
      const description = descriptionId
        ? harness.routeNativeElement?.querySelector(`#${descriptionId}`)
        : null;

      expect(email.getAttribute('aria-invalid')).toBe('true');
      expect(description?.textContent).toMatch(/e-mail institucional da UTFPR/i);
      expect(description?.textContent).not.toMatch(/(?:[\w-]+\.)+[a-z]{2,}\b/i);
      expect(sendLoginOtp).not.toHaveBeenCalled();
      expect(TestBed.inject(Router).url).toBe('/entrar');
    },
  );

  it.each([
    { input: 'ana@campus.example', email: 'ana@campus.example' },
    { input: 'ANA@UTFPR.EDU.BR', email: 'ana@utfpr.edu.br' },
  ])(
    'opens code verification with the confirmed email after a successful request for $input',
    async ({ input, email }) => {
      const router = TestBed.inject(Router);
      const response = new Subject<OtpChallenge>();
      sendLoginOtp.mockReturnValue(response);
      fillEmail(input);
      getSubmitButton().click();
      await harness.fixture.whenStable();

      expect(sendLoginOtp).toHaveBeenCalledExactlyOnceWith(input);
      expect(router.url).toBe('/entrar');

      response.next({ ...loginChallenge, email });
      await waitForSubmission();

      expect(router.url).toBe('/validar-codigo');
      expect(TestBed.inject(Location).getState()).toMatchObject({ email });
    },
  );

  it('disables repeat submissions while the OTP request is pending', async () => {
    const response = new Subject<OtpChallenge>();
    sendLoginOtp.mockReturnValue(response);
    fillEmail(loginChallenge.email);
    const submit = getSubmitButton();
    submit.click();
    await harness.fixture.whenStable();

    expect(submit.disabled).toBe(true);
    expect(submit.textContent).toMatch(/enviando código/i);

    submitForm();
    expect(sendLoginOtp).toHaveBeenCalledTimes(1);

    response.next(loginChallenge);
    await waitForSubmission();
  });

  it.each([
    {
      outcome: 'unregistered',
      error: 'E-mail não cadastrado. Crie uma conta primeiro.',
      message: /não cadastrado.*crie uma conta/i,
    },
    {
      outcome: 'suspended',
      error: 'Sua conta está suspensa.',
      message: /conta está suspensa/i,
    },
    {
      outcome: 'banned',
      error: 'Sua conta está banida.',
      message: /conta está banida/i,
    },
  ])('explains why a $outcome account cannot continue', async ({ error, message }) => {
    sendLoginOtp.mockReturnValue(throwError(() => new Error(error)));
    fillEmail(loginChallenge.email);
    getSubmitButton().click();
    await waitForSubmission();

    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toMatch(
      message,
    );
    expect(TestBed.inject(Router).url).toBe('/entrar');
  });

  it('reports a connection failure and retries with the same email', async () => {
    sendLoginOtp.mockReturnValueOnce(
      throwError(
        () =>
          new Error('Não foi possível enviar o código. Verifique sua conexão e tente novamente.'),
      ),
    );
    const email = fillEmail(loginChallenge.email);
    const submit = getSubmitButton();
    submit.click();
    await waitForSubmission();

    const router = TestBed.inject(Router);
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toMatch(
      /verifique sua conexão e tente novamente/i,
    );
    expect(email.value).toBe(loginChallenge.email);
    expect(submit.disabled).toBe(false);
    expect(router.url).toBe('/entrar');

    const retryResponse = new Subject<OtpChallenge>();
    sendLoginOtp.mockReturnValue(retryResponse);
    submit.click();
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('[role="alert"]')).toBeNull();
    expect(sendLoginOtp).toHaveBeenNthCalledWith(2, loginChallenge.email);
    retryResponse.next(loginChallenge);
    await waitForSubmission();

    expect(router.url).toBe('/validar-codigo');
  });

  function fillEmail(value: string): HTMLInputElement {
    const email =
      harness.routeNativeElement?.querySelector<HTMLInputElement>('input[type="email"]');
    if (!email) {
      throw new Error('Expected the institutional email field');
    }
    email.value = value;
    email.dispatchEvent(new Event('input', { bubbles: true }));
    return email;
  }

  function getSubmitButton(): HTMLButtonElement {
    const submit =
      harness.routeNativeElement?.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!submit) {
      throw new Error('Expected the OTP submission button');
    }
    return submit;
  }

  function submitForm(): void {
    harness.routeNativeElement
      ?.querySelector('form')
      ?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
  }

  async function waitForSubmission(): Promise<void> {
    // A continuação do envio pode agendar uma navegação antes de whenStable().
    await Promise.resolve();
    await harness.fixture.whenStable();
  }
});
