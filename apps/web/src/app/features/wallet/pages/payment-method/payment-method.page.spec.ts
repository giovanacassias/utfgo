import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { WALLET_API_URL } from '../../../../app.config';
import { Order, Payment, SIMULATED_USER_ID, User, Wallet } from '../../models/wallet.model';
import { WalletService } from '../../services/wallet.service';
import { PaymentMethodPage } from './payment-method.page';

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

describe('PaymentMethodPage', () => {
  let httpMock: HttpTestingController;
  let service: WalletService;
  let fixture: ComponentFixture<PaymentMethodPage>;
  let element: HTMLElement;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WALLET_API_URL, useValue: API },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(WalletService);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushLoad(options: { user?: User; orders?: Order[] } = {}): void {
    const url = (path: string) => (req: { method: string; url: string }) =>
      req.method === 'GET' && req.url === `${API}${path}`;
    httpMock.expectOne(url(`/users/${SIMULATED_USER_ID}`)).flush(options.user ?? activeUser);
    httpMock.expectOne(url('/wallets')).flush([baseWallet]);
    httpMock.expectOne(url('/orders')).flush(options.orders ?? []);
    httpMock.expectOne(url('/payments')).flush([]);
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();
  }

  async function render(options: { user?: User; orders?: Order[] } = {}): Promise<void> {
    fixture = TestBed.createComponent(PaymentMethodPage);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    flushLoad(options);
    await settle();
  }

  function post(path: string): TestRequest {
    return httpMock.expectOne((req) => req.method === 'POST' && req.url === `${API}${path}`);
  }

  function submitButton(): HTMLButtonElement {
    return element.querySelector<HTMLButtonElement>('[data-submit]') as HTMLButtonElement;
  }

  function methodButton(method: 'PIX' | 'CREDIT_CARD'): HTMLButtonElement {
    return element.querySelector<HTMLButtonElement>(`[data-method="${method}"]`) as HTMLButtonElement;
  }

  async function choose(method: 'PIX' | 'CREDIT_CARD'): Promise<void> {
    methodButton(method).click();
    await settle();
  }

  /** Completes a successful POST /orders + POST /payments chain. */
  async function flushCreation(tokensCount: number): Promise<void> {
    const order: Order = {
      id: 'order-new',
      userId: SIMULATED_USER_ID,
      tokensCount,
      amountCents: tokensCount * 200,
      status: 'PENDING',
      createdAt: '2026-10-12T10:00:00.000Z',
    };
    post('/orders').flush(order);
    await Promise.resolve();
    const payment: Payment = {
      id: 'pay-new',
      orderId: order.id,
      gatewayPaymentId: 'mp-pix-1',
      method: 'PIX',
      amountCents: order.amountCents,
      status: 'PENDING',
      paidAt: null,
      createdAt: '2026-10-12T10:00:01.000Z',
    };
    post('/payments').flush(payment);
    await settle();
  }

  it('shows the summary with quantity, unit price and total for the draft', async () => {
    service.setDraftTokensCount(8);
    await render();

    expect(element.textContent).toContain('8 fichas');
    expect(element.textContent).toContain('R$ 2,00');
    expect(element.textContent).toContain('R$ 16,00');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('starts with Pix selected and toggles the method and the button label', async () => {
    service.setDraftTokensCount(8);
    await render();

    expect(methodButton('PIX').getAttribute('aria-checked')).toBe('true');
    expect(methodButton('CREDIT_CARD').getAttribute('aria-checked')).toBe('false');
    expect(submitButton().textContent?.trim()).toBe('Confirmar e gerar Pix');

    await choose('CREDIT_CARD');
    expect(methodButton('PIX').getAttribute('aria-checked')).toBe('false');
    expect(methodButton('CREDIT_CARD').getAttribute('aria-checked')).toBe('true');
    expect(submitButton().textContent?.trim()).toBe('Continuar com cartão');

    await choose('PIX');
    expect(submitButton().textContent?.trim()).toBe('Confirmar e gerar Pix');
  });

  it('creates a PENDING Order and Payment for Pix and navigates only after success', async () => {
    service.setDraftTokensCount(8);
    await render();

    submitButton().click();
    fixture.detectChanges();

    const orderRequest = post('/orders');
    expect(orderRequest.request.body).toMatchObject({
      tokensCount: 8,
      amountCents: 1600,
      status: 'PENDING',
    });
    expect(navigate).not.toHaveBeenCalled();
    expect(submitButton().disabled).toBe(true);
    expect(submitButton().textContent?.trim()).toBe('Gerando Pix...');

    orderRequest.flush({ ...pendingOrder, id: 'order-new', tokensCount: 8, amountCents: 1600 });
    await Promise.resolve();
    const paymentRequest = post('/payments');
    expect(paymentRequest.request.body).toMatchObject({
      orderId: 'order-new',
      method: 'PIX',
      status: 'PENDING',
    });
    expect(navigate).not.toHaveBeenCalled();

    paymentRequest.flush({
      id: 'pay-new',
      ...paymentRequest.request.body,
    });
    await settle();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/cofrinho/pix']);
    expect(service.wallet()?.tokenBalance).toBe(10);
  });

  it('goes to /cofrinho/cartao with Card selected without any creation call', async () => {
    service.setDraftTokensCount(8);
    await render();
    await choose('CREDIT_CARD');

    submitButton().click();
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/cofrinho/cartao']);
    httpMock.expectNone((req) => req.method === 'POST');
  });

  it('retry flow: only POST /payments for the same orderId and no POST /orders', async () => {
    service.setDraftTokensCount(3);
    service.selectActiveOrder(pendingOrder.id);
    await render({ orders: [pendingOrder] });

    expect(navigate).not.toHaveBeenCalled();
    expect(element.textContent).toContain('5 fichas');
    expect(element.textContent).toContain('R$ 10,00');

    submitButton().click();
    await settle();

    httpMock.expectNone((req) => req.method === 'POST' && req.url === `${API}/orders`);
    const paymentRequest = post('/payments');
    expect(paymentRequest.request.body).toMatchObject({
      orderId: 'order-9',
      method: 'PIX',
      status: 'PENDING',
    });
    paymentRequest.flush({ id: 'pay-retry', ...paymentRequest.request.body });
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/cofrinho/pix']);
  });

  it('new purchase: an old PENDING Order does not override the new draft', async () => {
    const oldOrder: Order = { ...pendingOrder, id: 'order-old', tokensCount: 8, amountCents: 1600 };
    service.selectActiveOrder(oldOrder.id);
    service.setDraftTokensCount(20);
    await render({ orders: [oldOrder] });

    expect(navigate).not.toHaveBeenCalled();
    expect(element.textContent).toContain('20 fichas');
    expect(element.textContent).toContain('R$ 40,00');

    submitButton().click();
    fixture.detectChanges();

    const orderRequest = post('/orders');
    expect(orderRequest.request.body).toMatchObject({ tokensCount: 20, amountCents: 4000 });
    orderRequest.flush({ ...oldOrder, id: 'order-new', tokensCount: 20, amountCents: 4000 });
    await Promise.resolve();
    const paymentRequest = post('/payments');
    expect(paymentRequest.request.body).toMatchObject({ orderId: 'order-new' });
    paymentRequest.flush({ id: 'pay-new', ...paymentRequest.request.body });
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/cofrinho/pix']);
  });

  it('ignores repeated clicks while loading: a single Order is created', async () => {
    service.setDraftTokensCount(8);
    await render();

    submitButton().click();
    fixture.componentInstance.confirm();
    await fixture.componentInstance.confirm();
    fixture.detectChanges();

    const orderRequest = post('/orders');
    expect(submitButton().disabled).toBe(true);
    orderRequest.flush({ ...pendingOrder, id: 'order-new', tokensCount: 8, amountCents: 1600 });
    await Promise.resolve();
    post('/payments').flush({ id: 'pay-new', orderId: 'order-new' });
    await settle();

    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('server offline: shows the message, stays, keeps summary and method, and retries', async () => {
    service.setDraftTokensCount(8);
    await render();

    submitButton().click();
    post('/orders').error(new ProgressEvent('error'));
    await settle();

    const alert = element.querySelector<HTMLElement>('[data-error][role="alert"]');
    expect(alert?.textContent).toContain(MSG_OFFLINE);
    expect(navigate).not.toHaveBeenCalled();
    expect(service.draftTokensCount()).toBe(8);
    expect(element.textContent).toContain('R$ 16,00');
    expect(methodButton('PIX').getAttribute('aria-checked')).toBe('true');
    expect(submitButton().disabled).toBe(false);

    const retry = element.querySelector<HTMLButtonElement>('[data-retry]');
    expect(retry?.textContent?.trim()).toBe('Tentar novamente');
    retry?.click();
    fixture.detectChanges();
    await flushCreation(8);

    expect(navigate).toHaveBeenCalledWith(['/cofrinho/pix']);
  });

  it('redirects to /cofrinho/comprar without a draft and without an active order', async () => {
    await render();

    expect(navigate).toHaveBeenCalledWith(['/cofrinho/comprar']);
  });

  it('does not redirect while the wallet data is still loading', async () => {
    service.selectActiveOrder(pendingOrder.id);
    fixture = TestBed.createComponent(PaymentMethodPage);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();

    expect(navigate).not.toHaveBeenCalled();
    flushLoad({ orders: [pendingOrder] });
    await settle();

    expect(navigate).not.toHaveBeenCalled();
    expect(element.textContent).toContain('5 fichas');
  });

  it('blocked account: shows the message, disables method and button and refuses to advance', async () => {
    service.setDraftTokensCount(8);
    await render({ user: { ...activeUser, status: 'SUSPENDED' } });

    const alert = element.querySelector<HTMLElement>('[role="alert"]');
    expect(alert?.textContent).toContain(
      'Sua conta está suspensa e não pode realizar compras de fichas.',
    );
    expect(submitButton().disabled).toBe(true);
    expect(methodButton('PIX').disabled).toBe(true);
    expect(methodButton('CREDIT_CARD').disabled).toBe(true);

    await fixture.componentInstance.confirm();
    httpMock.expectNone((req) => req.method === 'POST');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('uses decorative <img> icons exported from Figma and no inline svg', async () => {
    service.setDraftTokensCount(8);
    await render();

    const images = Array.from(element.querySelectorAll('img'));
    const sources = images.map((image) => image.getAttribute('src') ?? '');
    expect(sources.some((src) => src.endsWith('ticket.svg'))).toBe(true);
    expect(sources.some((src) => src.endsWith('card.svg'))).toBe(true);
    expect(sources.some((src) => src.endsWith('bolt.svg'))).toBe(true);
    for (const image of images) {
      // The src is relative to the base href, so it must exist under apps/web/public/.
      const src = image.getAttribute('src') ?? '';
      expect(publicFileExists(src), `missing public file for ${src}`).toBe(true);
      expect(image.getAttribute('alt')).toBe('');
      expect(image.getAttribute('aria-hidden')).toBe('true');
    }
    expect(element.querySelector('svg')).toBeNull();
  });
});
