import { HttpInterceptorFn, HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { WALLET_API_URL } from '../../../../app.config';
import { Order, Payment, SIMULATED_USER_ID, User, Wallet } from '../../models/wallet.model';
import { WalletService } from '../../services/wallet.service';
import { CardPaymentPage } from './card-payment.page';

interface NodeProcess {
  cwd(): string;
  getBuiltinModule(name: 'fs'): { existsSync(path: string): boolean };
}

/** The spec tsconfig has no Node types, so Node's fs is reached through the process global. */
function publicFileExists(src: string): boolean {
  const nodeProcess = (globalThis as unknown as { process: NodeProcess }).process;
  const { existsSync } = nodeProcess.getBuiltinModule('fs');
  const cwd = nodeProcess.cwd().replaceAll('\\', '/');
  return [`${cwd}/public/${src}`, `${cwd}/apps/web/public/${src}`].some((path) => existsSync(path));
}

const API = 'http://api.utfgo.test';
const MSG_OFFLINE =
  'Não foi possível conectar ao servidor da carteira. Verifique sua conexão e tente novamente.';
const MSG_NAV = 'Não foi possível abrir a próxima tela. Volte ao Cofrinho para ver o seu pedido.';

// Bait values (RNF06): they must never leave the component.
const BAIT_NUMBER = '4111111111111111';
const BAIT_CVV = '123';
const BAIT_EXPIRY = '11/26';
const BAIT_HOLDER = 'MARIA TESTE';

const activeUser: User = {
  id: SIMULATED_USER_ID,
  email: 'caio@alunos.utfpr.edu.br',
  name: 'Caio',
  role: 'PASSENGER',
  status: 'ACTIVE',
  createdAt: '2026-10-01T10:00:00.000Z',
};

const baseWallet: Wallet = {
  id: 'wallet-1',
  userId: SIMULATED_USER_ID,
  tokenBalance: 10,
  penaltyPoints: 0,
  updatedAt: '2026-10-10T14:26:00.000Z',
};

const pendingOrder: Order = {
  id: 'order-9',
  userId: SIMULATED_USER_ID,
  tokensCount: 5,
  amountCents: 1000,
  status: 'PENDING',
  createdAt: '2026-10-11T10:00:00.000Z',
};

const cardPayment: Payment = {
  id: 'pay-1',
  orderId: 'order-9',
  gatewayPaymentId: 'mp-card-1-abc',
  method: 'CREDIT_CARD',
  amountCents: 1000,
  status: 'PENDING',
  paidAt: null,
  createdAt: '2026-10-11T10:00:01.000Z',
};

interface RenderOptions {
  user?: User;
  orders?: Order[];
  payments?: Payment[];
  /** Order selected as active (retry); null means none. Defaults to the PENDING order. */
  activeOrderId?: string | null;
  /** Draft quantity of a new purchase (cleared active order, as in the real flow). */
  draft?: number | null;
}

interface CapturedRequest {
  method: string;
  url: string;
  body: string;
  headers: string;
}

describe('CardPaymentPage', () => {
  let httpMock: HttpTestingController;
  let service: WalletService;
  let fixture: ComponentFixture<CardPaymentPage>;
  let element: HTMLElement;
  let navigate: ReturnType<typeof vi.spyOn>;
  let captured: CapturedRequest[];

  beforeEach(() => {
    captured = [];
    const capture: HttpInterceptorFn = (req: HttpRequest<unknown>, next) => {
      captured.push({
        method: req.method,
        url: req.urlWithParams,
        body: JSON.stringify(req.body ?? null),
        headers: req.headers
          .keys()
          .map((key) => `${key}=${req.headers.get(key)}`)
          .join(';'),
      });
      return next(req);
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([capture])),
        provideHttpClientTesting(),
        { provide: WALLET_API_URL, useValue: API },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(WalletService);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    // Only Date is frozen (promises and timers stay real): today is 2026-11-21.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 21, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    httpMock.verify();
  });

  async function tick(): Promise<void> {
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    await tick();
    fixture.detectChanges();
  }

  /** Loads the wallet into the real service (as the previous page did) and opens the page. */
  async function render(options: RenderOptions = {}): Promise<void> {
    if (options.draft !== undefined && options.draft !== null) {
      service.setDraftTokensCount(options.draft);
    }
    const activeOrderId =
      options.activeOrderId === undefined
        ? options.draft === undefined || options.draft === null
          ? 'order-9'
          : null
        : options.activeOrderId;
    if (activeOrderId !== null) {
      service.selectActiveOrder(activeOrderId);
    }

    const load = service.loadWalletData();
    const url = (path: string) => (req: { method: string; url: string }) =>
      req.method === 'GET' && req.url === `${API}${path}`;
    httpMock.expectOne(url(`/users/${SIMULATED_USER_ID}`)).flush(options.user ?? activeUser);
    httpMock.expectOne(url('/wallets')).flush([baseWallet]);
    httpMock.expectOne(url('/orders')).flush(options.orders ?? [pendingOrder]);
    httpMock.expectOne(url('/payments')).flush(options.payments ?? [cardPayment]);
    await load;
    captured.length = 0;

    fixture = TestBed.createComponent(CardPaymentPage);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await tick();
    fixture.detectChanges();
  }

  function patch(path: string): TestRequest {
    return httpMock.expectOne((req) => req.method === 'PATCH' && req.url === `${API}${path}`);
  }

  function post(path: string): TestRequest {
    return httpMock.expectOne((req) => req.method === 'POST' && req.url === `${API}${path}`);
  }

  function one<T extends HTMLElement>(selector: string): T {
    return element.querySelector<T>(selector) as T;
  }

  const payButton = () => one<HTMLButtonElement>('[data-pay]');
  const failButton = () => one<HTMLButtonElement>('[data-refuse]');
  const cancelButton = () => one<HTMLButtonElement>('[data-cancel]');

  type Field = 'holder' | 'number' | 'expiry' | 'cvv';
  const input = (field: Field) => one<HTMLInputElement>(`#card-${field}`);
  const fieldError = (field: Field) => element.querySelector<HTMLElement>(`[data-field-error="${field}"]`);

  function type(field: Field, value: string): void {
    const control = input(field);
    control.value = value;
    control.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function leave(field: Field): void {
    input(field).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function fillValid(): void {
    type('holder', BAIT_HOLDER);
    type('number', BAIT_NUMBER);
    type('expiry', BAIT_EXPIRY);
    type('cvv', BAIT_CVV);
  }

  async function flushApproval(paymentId = 'pay-1', orderId = 'order-9'): Promise<void> {
    patch(`/payments/${paymentId}`).flush({
      ...cardPayment,
      id: paymentId,
      status: 'PAID',
      paidAt: '2026-11-21T12:00:00.000Z',
    });
    await tick();
    patch(`/orders/${orderId}`).flush({ ...pendingOrder, id: orderId, status: 'COMPLETED' });
    await tick();
    patch('/wallets/wallet-1').flush({ ...baseWallet, tokenBalance: 15 });
    await settle();
  }

  describe('opening', () => {
    it('starts clean: no values, no errors, no red, Pay disabled', async () => {
      await render();

      for (const field of ['holder', 'number', 'expiry', 'cvv'] as const) {
        expect(input(field).value).toBe('');
        expect(fieldError(field)).toBeNull();
        expect(input(field).getAttribute('aria-invalid')).toBeNull();
        expect(input(field).className).not.toContain('border-danger');
      }
      expect(element.querySelector('[role="alert"]')).toBeNull();
      expect(payButton().disabled).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('creates Order + Payment (CREDIT_CARD) when there is a draft and no active order', async () => {
      await render({ draft: 5, orders: [], payments: [] });

      expect(payButton().disabled).toBe(true);
      const orderRequest = post('/orders');
      expect(orderRequest.request.body).toMatchObject({
        tokensCount: 5,
        amountCents: 1000,
        status: 'PENDING',
      });
      orderRequest.flush({ ...pendingOrder, id: 'order-new' });
      await tick();
      const paymentRequest = post('/payments');
      expect(paymentRequest.request.body).toMatchObject({
        orderId: 'order-new',
        method: 'CREDIT_CARD',
        status: 'PENDING',
      });
      paymentRequest.flush({ ...cardPayment, id: 'pay-new', orderId: 'order-new' });
      await settle();

      expect(navigate).not.toHaveBeenCalled();
      fillValid();
      expect(payButton().disabled).toBe(false);
      payButton().click();
      await tick();
      await flushApproval('pay-new', 'order-new');
      expect(navigate).toHaveBeenCalledWith(['/cofrinho/aprovado']);
    });

    it('with an active PENDING order and no card payment, creates only a Payment for that order', async () => {
      await render({ payments: [] });

      httpMock.expectNone((req) => req.method === 'POST' && req.url === `${API}/orders`);
      const request = post('/payments');
      expect(request.request.body).toMatchObject({ orderId: 'order-9', method: 'CREDIT_CARD' });
      request.flush({ ...cardPayment, id: 'pay-2' });
      await settle();

      fillValid();
      payButton().click();
      await tick();
      await flushApproval('pay-2');
      expect(navigate).toHaveBeenCalledWith(['/cofrinho/aprovado']);
    });

    it('with an active PENDING order whose payment is a PENDING Pix, creates a card Payment', async () => {
      await render({ payments: [{ ...cardPayment, id: 'pay-pix', method: 'PIX' }] });

      const request = post('/payments');
      expect(request.request.body).toMatchObject({ method: 'CREDIT_CARD' });
      request.flush({ ...cardPayment, id: 'pay-2' });
      await settle();
    });

    it('reuses an active PENDING CREDIT_CARD payment: no Order and no Payment is created', async () => {
      await render();

      httpMock.expectNone((req) => req.method === 'POST');
      httpMock.expectNone((req) => req.method === 'GET');
      fillValid();
      expect(payButton().disabled).toBe(false);
      expect(failButton().disabled).toBe(false);
    });

    it('without draft and without active order redirects to /cofrinho/comprar and renders nothing', async () => {
      await render({ activeOrderId: null, orders: [], payments: [] });

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(['/cofrinho/comprar']);
      expect(element.querySelector('form')).toBeNull();
      expect(element.querySelector('[data-pay]')).toBeNull();
      httpMock.expectNone((req) => req.method === 'POST');
    });

    it('with an active order that is not PENDING redirects to /cofrinho', async () => {
      await render({
        orders: [{ ...pendingOrder, status: 'COMPLETED' }],
        payments: [{ ...cardPayment, status: 'PAID' }],
      });

      expect(navigate).toHaveBeenCalledWith(['/cofrinho']);
      expect(element.querySelector('form')).toBeNull();
      httpMock.expectNone((req) => req.method === 'POST');
    });

    it('creation failure: shows the service message with "Tentar novamente", locks Pay/Refuse, retry creates', async () => {
      await render({ draft: 5, orders: [], payments: [] });

      post('/orders').error(new ProgressEvent('error'));
      await settle();

      const alert = element.querySelector<HTMLElement>('[data-error][role="alert"]');
      expect(alert?.textContent).toContain(MSG_OFFLINE);
      expect(payButton().disabled).toBe(true);
      expect(failButton().disabled).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
      const retry = one<HTMLButtonElement>('[data-retry]');
      expect(retry.textContent?.trim()).toBe('Tentar novamente');

      type('holder', BAIT_HOLDER);
      retry.click();
      fixture.detectChanges();
      post('/orders').flush({ ...pendingOrder, id: 'order-new' });
      await tick();
      post('/payments').flush({ ...cardPayment, id: 'pay-new', orderId: 'order-new' });
      await settle();

      expect(element.querySelector('[data-error]')).toBeNull();
      expect(input('holder').value).toBe(BAIT_HOLDER);
      fillValid();
      expect(payButton().disabled).toBe(false);
    });

    it('does not reload wallet data (no GET requests)', async () => {
      await render();
      httpMock.expectNone((req) => req.method === 'GET');
    });
  });

  describe('validation messages (Reactive Forms, spec table)', () => {
    interface Case {
      field: Field;
      value: string;
      message: string | null;
    }

    const cases: Case[] = [
      { field: 'holder', value: '', message: 'Informe o nome do titular, como está no cartão.' },
      { field: 'holder', value: '   ', message: 'Informe o nome do titular, como está no cartão.' },
      { field: 'holder', value: 'MARIA TESTE', message: null },
      { field: 'number', value: '', message: 'Informe o número do cartão.' },
      { field: 'number', value: '4111a11111111111', message: 'Digite apenas números.' },
      { field: 'number', value: '4111 1111', message: 'O número do cartão deve ter 16 dígitos.' },
      { field: 'number', value: '41111111111111111', message: 'O número do cartão deve ter 16 dígitos.' },
      { field: 'number', value: '4111111111111111', message: null },
      { field: 'number', value: '4111 1111 1111 1111', message: null },
      { field: 'number', value: '4111-1111-1111-1111', message: null },
      { field: 'expiry', value: '', message: 'Informe a validade do cartão.' },
      { field: 'expiry', value: '1126', message: 'Use o formato MM/AA, por exemplo 08/29.' },
      { field: 'expiry', value: '1/26', message: 'Use o formato MM/AA, por exemplo 08/29.' },
      { field: 'expiry', value: '11-26', message: 'Use o formato MM/AA, por exemplo 08/29.' },
      { field: 'expiry', value: '13/29', message: 'Mês inválido. Use de 01 a 12.' },
      { field: 'expiry', value: '00/29', message: 'Mês inválido. Use de 01 a 12.' },
      { field: 'expiry', value: '10/26', message: 'Este cartão está vencido.' },
      { field: 'expiry', value: '12/25', message: 'Este cartão está vencido.' },
      { field: 'expiry', value: '11/26', message: null },
      { field: 'expiry', value: '12/26', message: null },
      { field: 'expiry', value: '08/29', message: null },
      { field: 'cvv', value: '', message: 'Informe o código de segurança (CVV).' },
      { field: 'cvv', value: '12a', message: 'Digite apenas números.' },
      { field: 'cvv', value: '12', message: 'O CVV deve ter 3 ou 4 dígitos.' },
      { field: 'cvv', value: '12345', message: 'O CVV deve ter 3 ou 4 dígitos.' },
      { field: 'cvv', value: '123', message: null },
      { field: 'cvv', value: '1234', message: null },
    ];

    for (const { field, value, message } of cases) {
      it(`${field} "${value}" -> ${message ?? 'valid'}`, async () => {
        await render();

        if (value !== '') {
          type(field, value);
        }
        leave(field);

        const error = fieldError(field);
        if (message === null) {
          expect(error).toBeNull();
          expect(input(field).getAttribute('aria-invalid')).toBeNull();
          expect(input(field).className).not.toContain('border-danger');
        } else {
          expect(error?.textContent?.trim()).toBe(message);
          expect(error?.getAttribute('role')).toBe('alert');
          expect(error?.className).toContain('text-danger');
          expect(error?.className).toContain('bg-danger-surface');
          expect(input(field).getAttribute('aria-invalid')).toBe('true');
          expect(input(field).className).toContain('border-danger');
        }
      });
    }

    it('shows the error right after typing, before leaving the field', async () => {
      await render();

      type('number', '4111a');

      expect(fieldError('number')?.textContent?.trim()).toBe('Digite apenas números.');
    });

    it('does not show an error on a field that was never touched', async () => {
      await render();

      type('holder', BAIT_HOLDER);
      leave('holder');

      expect(fieldError('number')).toBeNull();
      expect(fieldError('expiry')).toBeNull();
      expect(fieldError('cvv')).toBeNull();
    });

    it('shows each empty-field error when leaving the fields in sequence, without typing', async () => {
      await render();

      leave('holder');
      expect(fieldError('holder')?.textContent?.trim()).toBe(
        'Informe o nome do titular, como está no cartão.',
      );

      leave('number');
      expect(fieldError('number')?.textContent?.trim()).toBe('Informe o número do cartão.');

      leave('expiry');
      expect(fieldError('expiry')?.textContent?.trim()).toBe('Informe a validade do cartão.');

      leave('cvv');
      expect(fieldError('cvv')?.textContent?.trim()).toBe('Informe o código de segurança (CVV).');

      expect(fieldError('holder')).not.toBeNull();
      expect(fieldError('number')).not.toBeNull();
      expect(fieldError('expiry')).not.toBeNull();
      expect(fieldError('cvv')).not.toBeNull();
    });

    it('keeps an untouched field without error while other fields were touched', async () => {
      await render();

      leave('holder');
      leave('number');

      expect(fieldError('holder')).not.toBeNull();
      expect(fieldError('number')).not.toBeNull();
      expect(fieldError('expiry')).toBeNull();
      expect(fieldError('cvv')).toBeNull();
    });

    it('the month of the expiry date is still valid until its last day (frozen 2026-11-21)', async () => {
      await render();
      vi.setSystemTime(new Date(2026, 10, 30, 23, 59, 0));

      type('expiry', '11/26');
      leave('expiry');
      expect(fieldError('expiry')).toBeNull();

      vi.setSystemTime(new Date(2026, 11, 1, 0, 0, 0));
      type('expiry', '11/26');
      expect(fieldError('expiry')?.textContent?.trim()).toBe('Este cartão está vencido.');
    });

    it('has labels bound to the inputs, autocomplete tokens, numeric keyboard and type text', async () => {
      await render();

      const expected: Record<Field, { autocomplete: string; inputmode: string | null }> = {
        holder: { autocomplete: 'cc-name', inputmode: null },
        number: { autocomplete: 'cc-number', inputmode: 'numeric' },
        expiry: { autocomplete: 'cc-exp', inputmode: 'numeric' },
        cvv: { autocomplete: 'cc-csc', inputmode: 'numeric' },
      };
      for (const field of ['holder', 'number', 'expiry', 'cvv'] as const) {
        expect(input(field).getAttribute('type')).toBe('text');
        expect(input(field).getAttribute('autocomplete')).toBe(expected[field].autocomplete);
        expect(input(field).getAttribute('inputmode')).toBe(expected[field].inputmode);
        expect(element.querySelector(`label[for="card-${field}"]`)).not.toBeNull();
      }
    });
  });

  describe('pay', () => {
    it('shows "Pagar R$ 10,00" and the order summary', async () => {
      await render();

      expect(payButton().textContent?.trim()).toBe('Pagar R$ 10,00');
      expect(payButton().className).toContain('bg-primary');
      expect(element.textContent).toContain('5 fichas');
      expect(element.textContent).toContain('R$ 2,00');
      expect(element.textContent).toContain('R$ 10,00');
      expect(element.textContent).toContain('à vista (1x)');
      expect(one('[data-back]').getAttribute('href')).toBe('/cofrinho/pagamento');
      expect(element.textContent).toContain('Pague com cartão de crédito');
    });

    it('keeps Pay disabled while the form is invalid', async () => {
      await render();

      type('holder', BAIT_HOLDER);
      type('number', BAIT_NUMBER);
      type('expiry', '10/26');
      type('cvv', BAIT_CVV);

      expect(payButton().disabled).toBe(true);
    });

    it('pay() refuses invalid data: marks every field, shows every error, calls nothing', async () => {
      await render();
      const confirm = vi.spyOn(service, 'confirmPayment');

      await fixture.componentInstance.pay();
      fixture.detectChanges();

      expect(confirm).not.toHaveBeenCalled();
      httpMock.expectNone((req) => req.method === 'PATCH');
      expect(navigate).not.toHaveBeenCalled();
      for (const field of ['holder', 'number', 'expiry', 'cvv'] as const) {
        expect(fieldError(field)).not.toBeNull();
        expect(input(field).getAttribute('aria-invalid')).toBe('true');
      }
    });

    it('a submit event (Enter) with an invalid form is refused the same way', async () => {
      await render();
      const confirm = vi.spyOn(service, 'confirmPayment');

      one<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
      await tick();
      fixture.detectChanges();

      expect(confirm).not.toHaveBeenCalled();
      expect(fieldError('holder')).not.toBeNull();
    });

    it('a submit event with a valid form pays (Enter goes through the same function)', async () => {
      await render();
      fillValid();

      one<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
      await tick();
      await flushApproval();

      expect(navigate).toHaveBeenCalledWith(['/cofrinho/aprovado']);
    });

    it('valid form: calls confirmPayment ONLY with the payment id and navigates only after true', async () => {
      await render();
      const confirm = vi.spyOn(service, 'confirmPayment');
      fillValid();

      payButton().click();
      fixture.detectChanges();
      expect(payButton().disabled).toBe(true);
      expect(payButton().textContent?.trim()).toBe('Processando pagamento...');
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(confirm.mock.calls[0]).toEqual(['pay-1']);

      patch('/payments/pay-1').flush({ ...cardPayment, status: 'PAID', paidAt: '2026-11-21T12:00:00.000Z' });
      await tick();
      expect(navigate).not.toHaveBeenCalled();
      patch('/orders/order-9').flush({ ...pendingOrder, status: 'COMPLETED' });
      await tick();
      patch('/wallets/wallet-1').flush({ ...baseWallet, tokenBalance: 15 });
      await settle();

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(['/cofrinho/aprovado']);
      expect(service.wallet()?.tokenBalance).toBe(15);
    });

    it('clears the form only on success (values gone after approving)', async () => {
      await render();
      fillValid();

      payButton().click();
      await tick();
      await flushApproval();

      for (const field of ['holder', 'number', 'expiry', 'cvv'] as const) {
        expect(input(field).value).toBe('');
      }
    });

    it('double click: a single request reaches the service, shared lock across all actions', async () => {
      await render();
      fillValid();

      payButton().click();
      await fixture.componentInstance.pay();
      await fixture.componentInstance.simulateRefusal();
      await fixture.componentInstance.cancel();
      payButton().click();
      fixture.detectChanges();

      httpMock.expectNone((req) => req.url.includes('/orders/'));
      const request = patch('/payments/pay-1');
      expect(request.request.body).toMatchObject({ status: 'PAID' });
      request.flush({ ...cardPayment, status: 'PAID' });
      await tick();
      patch('/orders/order-9').flush({ ...pendingOrder, status: 'COMPLETED' });
      await tick();
      patch('/wallets/wallet-1').flush({ ...baseWallet, tokenBalance: 15 });
      await settle();

      expect(navigate).toHaveBeenCalledTimes(1);
    });

    it('network error: shows the service message, does not navigate, keeps the 4 fields, retry approves', async () => {
      await render();
      fillValid();

      payButton().click();
      patch('/payments/pay-1').error(new ProgressEvent('error'));
      await settle();

      expect(element.querySelector('[data-error][role="alert"]')?.textContent).toContain(MSG_OFFLINE);
      expect(navigate).not.toHaveBeenCalled();
      expect(input('holder').value).toBe(BAIT_HOLDER);
      expect(input('number').value).toBe(BAIT_NUMBER);
      expect(input('expiry').value).toBe(BAIT_EXPIRY);
      expect(input('cvv').value).toBe(BAIT_CVV);
      expect(element.querySelector('form')).not.toBeNull();
      expect(payButton().disabled).toBe(false);

      one<HTMLButtonElement>('[data-retry]').click();
      fixture.detectChanges();
      await flushApproval();

      expect(navigate).toHaveBeenCalledWith(['/cofrinho/aprovado']);
    });

    it('partial failure (Order write fails): compensation message, fields kept, no navigation, retry approves', async () => {
      await render();
      fillValid();

      payButton().click();
      patch('/payments/pay-1').flush({ ...cardPayment, status: 'PAID' });
      await tick();
      patch('/orders/order-9').error(new ProgressEvent('error'));
      await tick();
      patch('/payments/pay-1').flush({ ...cardPayment, status: 'PENDING' });
      await settle();

      expect(element.querySelector('[data-error][role="alert"]')).not.toBeNull();
      expect(navigate).not.toHaveBeenCalled();
      expect(service.wallet()?.tokenBalance).toBe(10);
      expect(input('number').value).toBe(BAIT_NUMBER);
      expect(input('cvv').value).toBe(BAIT_CVV);

      one<HTMLButtonElement>('[data-retry]').click();
      fixture.detectChanges();
      await flushApproval();

      expect(navigate).toHaveBeenCalledWith(['/cofrinho/aprovado']);
    });
  });

  describe('refuse (sandbox) and cancel', () => {
    it('refuse does not need a valid form: calls failPayment, goes to /cofrinho/falha, balance intact', async () => {
      await render();
      const fail = vi.spyOn(service, 'failPayment');

      expect(failButton().disabled).toBe(false);
      failButton().click();
      fixture.detectChanges();
      const request = patch('/payments/pay-1');
      expect(request.request.body).toEqual({ status: 'FAILED' });
      expect(navigate).not.toHaveBeenCalled();
      request.flush({ ...cardPayment, status: 'FAILED' });
      await settle();

      expect(fail.mock.calls[0]).toEqual(['pay-1']);
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(['/cofrinho/falha']);
      expect(service.wallet()?.tokenBalance).toBe(10);
      httpMock.expectNone((req) => req.url.includes('/wallets') && req.method === 'PATCH');
    });

    it('refuse sits inside the sandbox box (grey, dashed); cancel does not', async () => {
      await render();

      const sandbox = one('[data-sandbox]');
      expect(sandbox.textContent).toContain('Ambiente de teste (sandbox)');
      expect(sandbox.className).toContain('border-dashed');
      expect(sandbox.className).toContain('bg-surface-muted');
      expect(sandbox.contains(failButton())).toBe(true);
      expect(failButton().textContent).toContain('Simular cartão recusado');
      expect(sandbox.contains(cancelButton())).toBe(false);
    });

    it('cancel does not need a valid form: calls cancelOrder, goes to /cofrinho, no confirmation', async () => {
      await render();
      const cancel = vi.spyOn(service, 'cancelOrder');

      expect(cancelButton().textContent).toContain('Cancelar pedido');
      expect(cancelButton().className).toContain('border-danger');
      expect(cancelButton().className).toContain('text-danger');
      cancelButton().click();
      fixture.detectChanges();
      const request = patch('/orders/order-9');
      expect(request.request.body).toEqual({ status: 'CANCELLED' });
      request.flush({ ...pendingOrder, status: 'CANCELLED' });
      await settle();

      expect(cancel.mock.calls[0]).toEqual(['order-9']);
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(['/cofrinho']);
      expect(service.wallet()?.tokenBalance).toBe(10);
    });

    it('network error on refuse: "Tentar novamente" repeats failPayment (not pay) and fields stay', async () => {
      await render();
      type('holder', BAIT_HOLDER);

      failButton().click();
      patch('/payments/pay-1').error(new ProgressEvent('error'));
      await settle();
      expect(navigate).not.toHaveBeenCalled();
      expect(input('holder').value).toBe(BAIT_HOLDER);

      one<HTMLButtonElement>('[data-retry]').click();
      fixture.detectChanges();
      const request = patch('/payments/pay-1');
      expect(request.request.body).toEqual({ status: 'FAILED' });
      request.flush({ ...cardPayment, status: 'FAILED' });
      await settle();

      expect(navigate).toHaveBeenCalledWith(['/cofrinho/falha']);
    });

    it('network error on cancel: "Tentar novamente" repeats cancelOrder', async () => {
      await render();

      cancelButton().click();
      patch('/orders/order-9').error(new ProgressEvent('error'));
      await settle();
      expect(navigate).not.toHaveBeenCalled();
      expect(element.querySelector('[data-error]')?.textContent).toContain(MSG_OFFLINE);

      one<HTMLButtonElement>('[data-retry]').click();
      fixture.detectChanges();
      patch('/orders/order-9').flush({ ...pendingOrder, status: 'CANCELLED' });
      await settle();

      expect(navigate).toHaveBeenCalledWith(['/cofrinho']);
    });
  });

  describe('after a successful action (page must not vanish) and navigation failure', () => {
    it('keeps the content while navigation is pending', async () => {
      await render();
      navigate.mockReturnValue(new Promise<boolean>(() => undefined));
      fillValid();

      payButton().click();
      await tick();
      await flushApproval();

      expect(element.querySelector('form')).not.toBeNull();
      expect(element.querySelector('[data-pay]')).not.toBeNull();
      expect(element.querySelector('[data-cancel]')).not.toBeNull();
      expect(element.querySelector('[data-refuse]')).not.toBeNull();
    });

    async function approveAndExpectNavigationFailure(): Promise<void> {
      fillValid();
      payButton().click();
      await tick();
      await flushApproval();

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(element.querySelector('form')).not.toBeNull();
      const alert = element.querySelector<HTMLElement>('[data-navigation-error][role="alert"]');
      expect(alert?.textContent).toContain(MSG_NAV);
      const back = alert?.querySelector<HTMLAnchorElement>('a[data-back-to-wallet]');
      expect(back?.getAttribute('href')).toBe('/cofrinho');
      expect(back?.className).toContain('min-h-11');
      expect(element.querySelector('[data-error]')).toBeNull();
      expect(element.querySelector('[data-retry]')).toBeNull();
    }

    it('navigate resolving false shows the navigation alert', async () => {
      await render();
      navigate.mockResolvedValue(false);
      await approveAndExpectNavigationFailure();
    });

    it('navigate rejecting shows the navigation alert', async () => {
      await render();
      navigate.mockRejectedValue(new Error('Cannot match any routes'));
      await approveAndExpectNavigationFailure();
    });

    it('does not act twice after the navigation failure', async () => {
      await render();
      navigate.mockResolvedValue(false);
      await approveAndExpectNavigationFailure();

      await fixture.componentInstance.pay();
      await fixture.componentInstance.cancel();
      await fixture.componentInstance.simulateRefusal();
      await settle();

      httpMock.expectNone((req) => req.method === 'PATCH');
      expect(navigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('privacy (RNF06)', () => {
    const baits: (string | RegExp)[] = [
      BAIT_NUMBER,
      BAIT_HOLDER,
      BAIT_EXPIRY,
      /(?<!\d)123(?!\d)/,
    ];

    function expectNoBait(text: string): void {
      for (const bait of baits) {
        if (typeof bait === 'string') {
          expect(text).not.toContain(bait);
        } else {
          expect(text).not.toMatch(bait);
        }
      }
    }

    async function runAndScan(action: () => Promise<void>): Promise<void> {
      await render();
      const serviceSpies: { mock: { calls: unknown[][] } }[] = [];
      const methods = [
        'confirmPayment',
        'failPayment',
        'cancelOrder',
        'createPaymentForOrder',
        'createOrderAndPayment',
        'loadWalletData',
        'setDraftTokensCount',
        'selectActiveOrder',
      ] as const;
      for (const method of methods) {
        const spy = vi.spyOn(service, method);
        serviceSpies.push(spy as unknown as { mock: { calls: unknown[][] } });
      }
      const consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) =>
        vi.spyOn(console, level).mockImplementation(() => undefined),
      );
      const localKeys = Object.keys(localStorage);
      const sessionKeys = Object.keys(sessionStorage);

      fillValid();
      await action();

      const serviceCalls = serviceSpies.map((spy) => spy.mock.calls);
      expectNoBait(JSON.stringify(serviceCalls));
      expect(serviceCalls.flat().length).toBeGreaterThan(0);
      expect(captured.length).toBeGreaterThan(0);
      expectNoBait(JSON.stringify(captured));
      expectNoBait(JSON.stringify(navigate.mock.calls));
      expect(Object.keys(localStorage)).toEqual(localKeys);
      expect(Object.keys(sessionStorage)).toEqual(sessionKeys);
      expectNoBait(JSON.stringify({ ...localStorage }));
      expectNoBait(JSON.stringify({ ...sessionStorage }));
      for (const spy of consoleSpies) {
        expect(spy).not.toHaveBeenCalled();
      }
    }

    it('approving: bait values appear in no request, service call, navigation, storage or console', async () => {
      await runAndScan(async () => {
        payButton().click();
        await tick();
        await flushApproval();
      });
    });

    it('refusing with the form filled leaks nothing', async () => {
      await runAndScan(async () => {
        failButton().click();
        patch('/payments/pay-1').flush({ ...cardPayment, status: 'FAILED' });
        await settle();
      });
    });

    it('cancelling with the form filled leaks nothing', async () => {
      await runAndScan(async () => {
        cancelButton().click();
        patch('/orders/order-9').flush({ ...pendingOrder, status: 'CANCELLED' });
        await settle();
      });
    });

    it('a failed approve with the form filled leaks nothing', async () => {
      await runAndScan(async () => {
        payButton().click();
        patch('/payments/pay-1').error(new ProgressEvent('error'));
        await settle();
      });
    });
  });

  describe('blocked account', () => {
    it('shows the block message, disables Pay even with a valid form and refuses to pay', async () => {
      await render({ user: { ...activeUser, status: 'SUSPENDED' } });
      fillValid();

      expect(element.querySelector('[data-account-blocked][role="alert"]')?.textContent).toContain(
        'Sua conta está suspensa e não pode realizar compras de fichas.',
      );
      expect(payButton().disabled).toBe(true);

      await fixture.componentInstance.pay();
      httpMock.expectNone((req) => req.method === 'PATCH');
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('assets', () => {
    it('uses the decorative icons/card.svg that exists in public/ and no inline svg', async () => {
      await render();

      const images = Array.from(element.querySelectorAll('img'));
      const sources = images.map((image) => image.getAttribute('src') ?? '');
      expect(sources).toContain('icons/card.svg');
      for (const image of images) {
        const src = image.getAttribute('src') ?? '';
        expect(publicFileExists(src), `missing public file for ${src}`).toBe(true);
        expect(image.getAttribute('alt')).toBe('');
        expect(image.getAttribute('aria-hidden')).toBe('true');
      }
      expect(element.querySelector('svg')).toBeNull();
    });
  });
});
