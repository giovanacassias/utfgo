import { provideHttpClient } from '@angular/common/http';
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
import { PaymentFailedPage } from './payment-failed.page';

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
const MSG_NAV =
  'Não foi possível abrir a próxima tela. Volte ao Cofrinho para ver o seu pedido.';

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
  tokensCount: 8,
  amountCents: 1600,
  status: 'PENDING',
  createdAt: '2026-10-12T15:39:00',
};

const failedPayment: Payment = {
  id: 'pay-1',
  orderId: 'order-9',
  gatewayPaymentId: 'mp-pix-1-abc',
  method: 'PIX',
  amountCents: 1600,
  status: 'FAILED',
  paidAt: null,
  createdAt: '2026-10-12T15:40:00',
};

interface RenderOptions {
  orders?: Order[];
  payments?: Payment[];
  activeOrderId?: string | null;
}

describe('PaymentFailedPage', () => {
  let httpMock: HttpTestingController;
  let service: WalletService;
  let fixture: ComponentFixture<PaymentFailedPage>;
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

  async function render(options: RenderOptions = {}): Promise<void> {
    const activeOrderId = options.activeOrderId === undefined ? 'order-9' : options.activeOrderId;
    service.selectActiveOrder(activeOrderId);

    const load = service.loadWalletData();
    const url = (path: string) => (req: { method: string; url: string }) =>
      req.method === 'GET' && req.url === `${API}${path}`;
    httpMock.expectOne(url(`/users/${SIMULATED_USER_ID}`)).flush(activeUser);
    httpMock.expectOne(url('/wallets')).flush([baseWallet]);
    httpMock.expectOne(url('/orders')).flush(options.orders ?? [pendingOrder]);
    httpMock.expectOne(url('/payments')).flush(options.payments ?? [failedPayment]);
    await load;

    fixture = TestBed.createComponent(PaymentFailedPage);
    element = fixture.nativeElement as HTMLElement;
    await settle();
  }

  const text = (selector: string): string =>
    element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  function click(selector: string): void {
    const target = element.querySelector<HTMLElement>(selector);
    expect(target, selector).not.toBeNull();
    target?.click();
  }

  const isDisabled = (selector: string): boolean | undefined =>
    element.querySelector<HTMLButtonElement>(selector)?.disabled;

  function postPayment(): TestRequest {
    return httpMock.expectOne((req) => req.method === 'POST' && req.url === `${API}/payments`);
  }

  const newPixPayment: Payment = {
    ...failedPayment,
    id: 'pay-2',
    gatewayPaymentId: 'mp-pix-2-xyz',
    status: 'PENDING',
  };

  it('shows the order summary: requested quantity, order total, date, transaction id and reason', async () => {
    await render();

    expect(text('[data-summary-quantity]')).toBe('8 fichas');
    expect(text('[data-summary-total]')).toBe('R$ 16,00');
    expect(text('[data-summary-date]')).toBe('12/10/2026 15:40');
    expect(text('[data-summary-transaction]')).toBe('mp-pix-1-abc');
    expect(text('[data-summary-reason]')).toBe('Tempo limite de pagamento excedido');
    expect(element.querySelector('[data-summary-reason]')?.className).toContain('text-danger');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('uses the singular "1 ficha" for the requested quantity when the count is 1', async () => {
    await render({ orders: [{ ...pendingOrder, tokensCount: 1, amountCents: 200 }] });

    expect(text('[data-summary-quantity]')).toBe('1 ficha');
  });

  it('Pix texts: reason, subtitle, pill and desktop headline', async () => {
    await render();

    expect(text('[data-subtitle]')).toBe(
      'O código Pix expirou. Nenhuma cobrança foi realizada em sua conta.',
    );
    expect(text('[data-pill]')).toBe('CÓDIGO EXPIRADO');
    expect(text('[data-desktop-headline]')).toBe('O banco não confirmou o Pix dentro do prazo.');
    expect(text('[data-desktop-text]')).toBe(
      'Nenhuma cobrança foi realizada. Escolha outra forma de pagamento para tentar novamente.',
    );
  });

  it('Card texts: reason, subtitle, pill and desktop headline', async () => {
    await render({ payments: [{ ...failedPayment, method: 'CREDIT_CARD' }] });

    expect(text('[data-summary-reason]')).toBe('Pagamento recusado pelo emissor do cartão');
    expect(text('[data-subtitle]')).toBe(
      'O cartão foi recusado. Nenhuma cobrança foi realizada em sua conta.',
    );
    expect(text('[data-pill]')).toBe('CARTÃO RECUSADO');
    expect(text('[data-desktop-headline]')).toBe('O emissor do cartão não autorizou o pagamento.');
  });

  it('shows the headings of each width', async () => {
    await render();

    expect(text('[data-title-mobile]')).toBe('Falha no pagamento');
    expect(element.querySelector('[data-title-mobile] .text-danger')?.textContent).toContain(
      'Falha',
    );
    expect(text('[data-eyebrow]')).toBe('PAGAMENTO NÃO CONCLUÍDO');
    expect(text('[data-title-desktop]')).toBe('Falha no pagamento');
    expect(element.querySelector('[data-pill]')?.className).toContain('bg-danger-surface');
  });

  it('"Tentar novamente" with Pix: creates a Payment for the SAME order, then goes to /cofrinho/pix', async () => {
    await render();

    click('[data-try-again="mobile"]');
    fixture.detectChanges();
    const request = postPayment();
    expect(request.request.body).toMatchObject({ orderId: 'order-9', method: 'PIX', status: 'PENDING' });
    expect(navigate).not.toHaveBeenCalled();
    request.flush(newPixPayment);
    await settle();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/cofrinho/pix']);
    httpMock.expectNone((req) => req.method === 'POST' && req.url === `${API}/orders`);
    expect(service.orders().length).toBe(1);
  });

  it('keeps showing the failed attempt while navigating after a Pix retry', async () => {
    await render();
    navigate.mockReturnValue(new Promise<boolean>(() => undefined));

    click('[data-try-again="desktop"]');
    postPayment().flush(newPixPayment);
    await settle();

    expect(text('[data-summary-transaction]')).toBe('mp-pix-1-abc');
    expect(text('[data-summary-reason]')).toBe('Tempo limite de pagamento excedido');
  });

  it('"Tentar novamente" with card: goes to /cofrinho/cartao with no HTTP call', async () => {
    await render({ payments: [{ ...failedPayment, method: 'CREDIT_CARD' }] });

    click('[data-try-again="desktop"]');
    await settle();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/cofrinho/cartao']);
    httpMock.expectNone(() => true);
  });

  it('"Escolher outra forma de pagamento" goes to /cofrinho/pagamento with no HTTP call', async () => {
    await render();

    click('[data-other-method="mobile"]');
    await settle();
    click('[data-other-method="desktop"]');
    await settle();

    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenLastCalledWith(['/cofrinho/pagamento']);
    expect(service.activeOrderId()).toBe('order-9');
    httpMock.expectNone(() => true);
  });

  it('"Cancelar pedido" cancels the same order without confirmation and returns to /cofrinho', async () => {
    await render();

    click('[data-cancel]');
    fixture.detectChanges();
    const request = httpMock.expectOne(
      (req) => req.method === 'PATCH' && req.url === `${API}/orders/order-9`,
    );
    expect(request.request.body).toEqual({ status: 'CANCELLED' });
    request.flush({ ...pendingOrder, status: 'CANCELLED' });
    await settle();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/cofrinho']);
    expect(service.orders()[0].status).toBe('CANCELLED');
    expect(service.wallet()?.tokenBalance).toBe(10);
    httpMock.expectNone((req) => req.method === 'POST');
    expect(element.querySelector('[data-cancel]')?.className).toContain('border-danger');
    expect(element.querySelector('[data-cancel]')?.className).toContain('text-danger');
  });

  it('shared lock: while an action runs every action is disabled and a double click sends one request', async () => {
    await render();

    click('[data-try-again="mobile"]');
    fixture.detectChanges();
    click('[data-try-again="mobile"]');
    click('[data-try-again="desktop"]');
    click('[data-cancel]');
    click('[data-other-method="mobile"]');
    await fixture.componentInstance.cancel();

    for (const selector of [
      '[data-try-again="mobile"]',
      '[data-try-again="desktop"]',
      '[data-other-method="mobile"]',
      '[data-other-method="desktop"]',
      '[data-cancel]',
    ]) {
      expect(isDisabled(selector), selector).toBe(true);
    }
    postPayment().flush(newPixPayment);
    await settle();

    expect(navigate).toHaveBeenCalledTimes(1);
    httpMock.expectNone((req) => req.method === 'PATCH');
  });

  it('network error on Pix retry: shows the service message in an alert, no navigation, retry repeats it', async () => {
    await render();

    click('[data-try-again="mobile"]');
    postPayment().error(new ProgressEvent('error'));
    await settle();

    expect(element.querySelector('[data-error][role="alert"]')?.textContent).toContain(MSG_OFFLINE);
    expect(navigate).not.toHaveBeenCalled();
    expect(isDisabled('[data-try-again="mobile"]')).toBe(false);
    expect(text('[data-retry]')).toBe('Tentar novamente');

    click('[data-retry]');
    fixture.detectChanges();
    postPayment().flush(newPixPayment);
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/cofrinho/pix']);
  });

  it('network error on cancel: "Tentar novamente" repeats cancelOrder, not the Pix retry', async () => {
    await render();

    click('[data-cancel]');
    httpMock
      .expectOne((req) => req.method === 'PATCH' && req.url === `${API}/orders/order-9`)
      .error(new ProgressEvent('error'));
    await settle();
    expect(element.querySelector('[data-error]')?.textContent).toContain(MSG_OFFLINE);
    expect(navigate).not.toHaveBeenCalled();

    click('[data-retry]');
    fixture.detectChanges();
    httpMock
      .expectOne((req) => req.method === 'PATCH' && req.url === `${API}/orders/order-9`)
      .flush({ ...pendingOrder, status: 'CANCELLED' });
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/cofrinho']);
    httpMock.expectNone((req) => req.method === 'POST');
  });

  it('navigation failure after an action: alert with a way back, page stays, no further actions', async () => {
    await render({ payments: [{ ...failedPayment, method: 'CREDIT_CARD' }] });
    navigate.mockResolvedValue(false);

    click('[data-try-again="mobile"]');
    await settle();

    const alert = element.querySelector<HTMLElement>('[data-navigation-error][role="alert"]');
    expect(alert?.textContent).toContain(MSG_NAV);
    expect(alert?.querySelector('a[data-back-to-wallet]')?.getAttribute('href')).toBe('/cofrinho');
    expect(element.querySelector('[data-error]')).toBeNull();
    expect(text('[data-summary-transaction]')).toBe('mp-pix-1-abc');

    click('[data-other-method="mobile"]');
    await fixture.componentInstance.cancel();
    expect(navigate).toHaveBeenCalledTimes(1);
    httpMock.expectNone(() => true);
  });

  it('navigation rejecting also shows the alert', async () => {
    await render();
    navigate.mockRejectedValue(new Error('Cannot match any routes'));

    click('[data-other-method="mobile"]');
    await settle();

    expect(element.querySelector('[data-navigation-error][role="alert"]')).not.toBeNull();
  });

  it('redirects to /cofrinho without active order, with no HTTP calls', async () => {
    await render({ activeOrderId: null });

    expect(navigate).toHaveBeenCalledWith(['/cofrinho']);
    expect(element.querySelector('[data-summary-quantity]')).toBeNull();
    httpMock.expectNone(() => true);
  });

  it('redirects to /cofrinho when the order is not PENDING', async () => {
    await render({ orders: [{ ...pendingOrder, status: 'CANCELLED' }] });

    expect(navigate).toHaveBeenCalledWith(['/cofrinho']);
    expect(element.querySelector('[data-summary-quantity]')).toBeNull();
    httpMock.expectNone(() => true);
  });

  it('redirects to /cofrinho when the payment is not FAILED', async () => {
    await render({ payments: [{ ...failedPayment, status: 'PENDING' }] });

    expect(navigate).toHaveBeenCalledWith(['/cofrinho']);
    expect(element.querySelector('[data-summary-quantity]')).toBeNull();
    httpMock.expectNone(() => true);
  });

  it('uses decorative <img> assets that exist in public/ and no inline svg', async () => {
    await render();

    const images = Array.from(element.querySelectorAll('img'));
    expect(images.some((image) => image.getAttribute('src')?.endsWith('payment-failed.png'))).toBe(
      true,
    );
    for (const image of images) {
      const src = image.getAttribute('src') ?? '';
      expect(publicFileExists(src), `missing public file for ${src}`).toBe(true);
      expect(image.getAttribute('alt')).toBe('');
      expect(image.getAttribute('aria-hidden')).toBe('true');
    }
    expect(element.querySelector('svg')).toBeNull();
  });
});
