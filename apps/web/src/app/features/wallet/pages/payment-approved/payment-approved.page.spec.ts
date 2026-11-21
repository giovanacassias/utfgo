import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { WALLET_API_URL } from '../../../../app.config';
import { Order, Payment, SIMULATED_USER_ID, User, Wallet } from '../../models/wallet.model';
import { WalletService } from '../../services/wallet.service';
import { PaymentApprovedPage } from './payment-approved.page';

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

const newWallet: Wallet = {
  id: 'wallet-1',
  userId: SIMULATED_USER_ID,
  tokenBalance: 15,
  penaltyPoints: 0,
  updatedAt: '2026-10-12T15:40:00',
};

const completedOrder: Order = {
  id: 'order-9',
  userId: SIMULATED_USER_ID,
  tokensCount: 8,
  amountCents: 1600,
  status: 'COMPLETED',
  createdAt: '2026-10-12T15:39:00',
};

const paidPayment: Payment = {
  id: 'pay-1',
  orderId: 'order-9',
  gatewayPaymentId: 'mp-pix-1-abc',
  method: 'PIX',
  amountCents: 1600,
  status: 'PAID',
  paidAt: '2026-10-12T15:40:00',
  createdAt: '2026-10-12T15:39:30',
};

interface RenderOptions {
  orders?: Order[];
  payments?: Payment[];
  activeOrderId?: string | null;
  wallet?: Wallet;
}

describe('PaymentApprovedPage', () => {
  let httpMock: HttpTestingController;
  let service: WalletService;
  let fixture: ComponentFixture<PaymentApprovedPage>;
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
    httpMock.expectOne(url('/wallets')).flush([options.wallet ?? newWallet]);
    httpMock.expectOne(url('/orders')).flush(options.orders ?? [completedOrder]);
    httpMock.expectOne(url('/payments')).flush(options.payments ?? [paidPayment]);
    await load;

    fixture = TestBed.createComponent(PaymentApprovedPage);
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

  it('shows the receipt: quantity, unit value, total via Pix, date, transaction id and new balance', async () => {
    await render();

    expect(text('[data-summary-quantity]')).toBe('8 fichas');
    expect(text('[data-summary-unit]')).toBe('R$ 2,00');
    expect(text('[data-summary-total-label]')).toBe('Total pago via Pix');
    expect(text('[data-summary-total]')).toBe('R$ 16,00');
    expect(text('[data-summary-date]')).toBe('12/10/2026 15:40');
    expect(text('[data-summary-transaction]')).toBe('mp-pix-1-abc');
    expect(text('[data-summary-balance-label]')).toBe('Novo saldo');
    expect(text('[data-summary-balance]')).toBe('15 fichas');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('uses the singular "1 ficha" for quantity and new balance when the count is 1', async () => {
    await render({
      orders: [{ ...completedOrder, tokensCount: 1, amountCents: 200 }],
      wallet: { ...newWallet, tokenBalance: 1 },
    });

    expect(text('[data-summary-quantity]')).toBe('1 ficha');
    expect(text('[data-summary-balance]')).toBe('1 ficha');
  });

  it('labels the total "via Cartão" and the pill "CARTÃO APROVADO" for a card payment', async () => {
    await render({ payments: [{ ...paidPayment, method: 'CREDIT_CARD' }] });

    expect(text('[data-summary-total-label]')).toBe('Total pago via Cartão');
    expect(text('[data-pill]')).toBe('CARTÃO APROVADO');
  });

  it('shows the headings of each width: mobile "Pagamento aprovado" and desktop label, title and pill', async () => {
    await render();

    expect(text('[data-title-mobile]')).toBe('Pagamento aprovado');
    expect(element.querySelector('[data-title-mobile] .text-success')?.textContent).toContain(
      'aprovado',
    );
    expect(text('[data-eyebrow]')).toBe('COMPRA CONCLUÍDA');
    expect(text('[data-title-desktop]')).toBe('Pagamento aprovado');
    expect(text('[data-pill]')).toBe('PIX VALIDADO');
    expect(element.querySelector('[data-pill]')?.className).toContain('bg-success');
    expect(element.querySelector('[data-pill]')?.className).not.toContain('text-white');
  });

  it('"Buscar carona" is disabled and shows "Em breve", at both sizes', async () => {
    await render();

    for (const size of ['mobile', 'desktop']) {
      const button = element.querySelector<HTMLButtonElement>(`[data-find-ride="${size}"]`);
      expect(button?.disabled, size).toBe(true);
      expect(button?.textContent, size).toContain('Buscar carona');
      expect(button?.textContent, size).toContain('Em breve');
    }
  });

  it('"Ir para o cofrinho" navigates to /cofrinho, at both sizes', async () => {
    await render();

    click('[data-go-wallet="mobile"]');
    await settle();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenLastCalledWith(['/cofrinho']);

    click('[data-go-wallet="desktop"]');
    await settle();
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenLastCalledWith(['/cofrinho']);
  });

  it('double click: a single navigation while the first is pending, and the buttons are locked', async () => {
    await render();
    navigate.mockReturnValue(new Promise<boolean>(() => undefined));

    click('[data-go-wallet="mobile"]');
    fixture.detectChanges();
    click('[data-go-wallet="mobile"]');
    click('[data-go-wallet="desktop"]');

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(element.querySelector<HTMLButtonElement>('[data-go-wallet="mobile"]')?.disabled).toBe(
      true,
    );
    expect(element.querySelector<HTMLButtonElement>('[data-go-wallet="desktop"]')?.disabled).toBe(
      true,
    );
  });

  it('navigation failure (false or rejection): alert with a way back, page stays, no second navigation', async () => {
    await render();
    navigate.mockResolvedValue(false);

    click('[data-go-wallet="mobile"]');
    await settle();

    const alert = element.querySelector<HTMLElement>('[data-navigation-error][role="alert"]');
    expect(alert?.textContent).toContain(MSG_NAV);
    expect(alert?.querySelector('a[data-back-to-wallet]')?.getAttribute('href')).toBe('/cofrinho');
    expect(text('[data-summary-transaction]')).toBe('mp-pix-1-abc');

    click('[data-go-wallet="desktop"]');
    await settle();
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('navigation rejecting also shows the alert', async () => {
    await render();
    navigate.mockRejectedValue(new Error('Cannot match any routes'));

    click('[data-go-wallet="mobile"]');
    await settle();

    expect(element.querySelector('[data-navigation-error][role="alert"]')).not.toBeNull();
  });

  it('redirects to /cofrinho without active order, with no HTTP calls', async () => {
    await render({ activeOrderId: null });

    expect(navigate).toHaveBeenCalledWith(['/cofrinho']);
    expect(element.querySelector('[data-summary-quantity]')).toBeNull();
    httpMock.expectNone(() => true);
  });

  it('redirects to /cofrinho when the order is not COMPLETED', async () => {
    await render({ orders: [{ ...completedOrder, status: 'PENDING' }] });

    expect(navigate).toHaveBeenCalledWith(['/cofrinho']);
    expect(element.querySelector('[data-summary-quantity]')).toBeNull();
    httpMock.expectNone(() => true);
  });

  it('redirects to /cofrinho when the payment is not PAID', async () => {
    await render({ payments: [{ ...paidPayment, status: 'FAILED' }] });

    expect(navigate).toHaveBeenCalledWith(['/cofrinho']);
    expect(element.querySelector('[data-summary-quantity]')).toBeNull();
    httpMock.expectNone(() => true);
  });

  it('is read-only: never calls the service writers', async () => {
    await render();
    click('[data-go-wallet="mobile"]');
    await settle();

    httpMock.expectNone((req) => req.method !== 'GET');
    httpMock.expectNone(() => true);
  });

  it('uses decorative <img> assets that exist in public/ and no inline svg', async () => {
    await render();

    const images = Array.from(element.querySelectorAll('img'));
    expect(images.some((image) => image.getAttribute('src')?.endsWith('payment-approved.png'))).toBe(
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
