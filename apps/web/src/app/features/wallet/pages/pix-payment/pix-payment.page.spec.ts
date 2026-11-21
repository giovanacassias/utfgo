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
import {
  buildPixCopyPasteCode,
  Order,
  Payment,
  SIMULATED_USER_ID,
  User,
  Wallet,
} from '../../models/wallet.model';
import { WalletService } from '../../services/wallet.service';
import { PixPaymentPage } from './pix-payment.page';

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
const MSG_COPY_FAIL = 'Não foi possível copiar. Selecione o código e copie manualmente.';

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

const pendingPayment: Payment = {
  id: 'pay-1',
  orderId: 'order-9',
  gatewayPaymentId: 'mp-pix-1-abc',
  method: 'PIX',
  amountCents: 1000,
  status: 'PENDING',
  paidAt: null,
  createdAt: '2026-10-11T10:00:01.000Z',
};

interface RenderOptions {
  user?: User;
  orders?: Order[];
  payments?: Payment[];
  activeOrderId?: string | null;
}

describe('PixPaymentPage', () => {
  let httpMock: HttpTestingController;
  let service: WalletService;
  let fixture: ComponentFixture<PixPaymentPage>;
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
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, 'clipboard');
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

  /** Loads the wallet data into the real service (as the previous page did), then renders. */
  async function render(options: RenderOptions = {}): Promise<void> {
    const activeOrderId = options.activeOrderId === undefined ? 'order-9' : options.activeOrderId;
    service.selectActiveOrder(activeOrderId);

    const load = service.loadWalletData();
    const url = (path: string) => (req: { method: string; url: string }) =>
      req.method === 'GET' && req.url === `${API}${path}`;
    httpMock.expectOne(url(`/users/${SIMULATED_USER_ID}`)).flush(options.user ?? activeUser);
    httpMock.expectOne(url('/wallets')).flush([baseWallet]);
    httpMock.expectOne(url('/orders')).flush(options.orders ?? [pendingOrder]);
    httpMock.expectOne(url('/payments')).flush(options.payments ?? [pendingPayment]);
    await load;

    fixture = TestBed.createComponent(PixPaymentPage);
    element = fixture.nativeElement as HTMLElement;
    await settle();
  }

  function patch(path: string): TestRequest {
    return httpMock.expectOne((req) => req.method === 'PATCH' && req.url === `${API}${path}`);
  }

  function one<T extends HTMLElement>(selector: string): T {
    return element.querySelector<T>(selector) as T;
  }

  const approveMobile = () => one<HTMLButtonElement>('[data-approve="mobile"]');
  const approveDesktop = () => one<HTMLButtonElement>('[data-approve="desktop"]');
  const failButton = () => one<HTMLButtonElement>('[data-fail]');
  const cancelButton = () => one<HTMLButtonElement>('[data-cancel]');
  const copyButton = () => one<HTMLButtonElement>('[data-copy]');
  const copyStatus = () => one<HTMLElement>('[data-copy-status]');

  function stubClipboard(writeText: (text: string) => Promise<void>): void {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  }

  /** Completes a successful confirmation chain: Payment PAID, Order COMPLETED, Wallet credited. */
  async function flushApproval(): Promise<void> {
    patch('/payments/pay-1').flush({ ...pendingPayment, status: 'PAID', paidAt: '2026-10-12T10:00:00.000Z' });
    await tick();
    patch('/orders/order-9').flush({ ...pendingOrder, status: 'COMPLETED' });
    await tick();
    patch('/wallets/wallet-1').flush({ ...baseWallet, tokenBalance: 15 });
    await settle();
  }

  it('shows the AGUARDANDO PAGAMENTO label at both sizes, the Pix label and the 3 steps', async () => {
    await render();

    const badges = Array.from(element.querySelectorAll('[data-waiting-badge]'));
    expect(badges.length).toBe(2);
    for (const badge of badges) {
      expect(badge.textContent?.trim()).toBe('AGUARDANDO PAGAMENTO');
      expect(badge.className).toContain('bg-warning-surface');
      expect(badge.className).not.toContain('text-white');
    }
    expect(element.textContent).toContain('PAGAMENTO VIA PIX');
    expect(element.textContent).toContain('Tudo pronto! Agora é só realizar o pagamento');
    expect(element.textContent).toContain('Código Pix Copia e Cola');
    expect(element.querySelectorAll('[data-step]').length).toBe(3);
    expect(element.textContent).toContain('Abra o app do banco desejado e selecione a área Pix');
    expect(element.textContent).toContain('Confirme o pagamento. Suas fichas ficarão disponíveis');
    expect(element.textContent).toContain('R$ 10,00');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows a Pix code derived from the gatewayPaymentId and the amount', async () => {
    await render();

    const expected = buildPixCopyPasteCode('mp-pix-1-abc', 1000);
    expect(element.querySelector('[data-pix-code]')?.textContent?.trim()).toBe(expected);
    expect(expected).toContain('mp-pix-1-abc');
    expect(expected).toContain('10.00');
  });

  it('copies the code: shows "Código copiado!" in a status region and returns to normal after 2s', async () => {
    await render();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    vi.useFakeTimers();

    expect(copyButton().textContent).toContain('Copiar código Pix');
    copyButton().click();
    await tick();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith(buildPixCopyPasteCode('mp-pix-1-abc', 1000));
    expect(copyButton().textContent).toContain('Código copiado!');
    expect(copyStatus().getAttribute('role')).toBe('status');
    expect(copyStatus().textContent).toContain('Código copiado!');

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    expect(copyButton().textContent).toContain('Copiar código Pix');
    expect(copyButton().textContent).not.toContain('Código copiado!');
    expect(copyStatus().textContent?.trim()).toBe('');
  });

  it('clears the copy timer when the component is destroyed', async () => {
    await render();
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    vi.useFakeTimers();

    const setSpy = vi.spyOn(globalThis, 'setTimeout');
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    copyButton().click();
    await tick();
    const copyTimerCall = setSpy.mock.calls.find((call) => call[1] === 2000);
    expect(copyTimerCall).toBeDefined();
    const handle = setSpy.mock.results[setSpy.mock.calls.indexOf(copyTimerCall!)].value;
    clearSpy.mockClear();

    fixture.destroy();

    expect(clearSpy).toHaveBeenCalledWith(handle);
  });

  it('copy failure (rejected promise): shows the manual-copy message and keeps the code selectable', async () => {
    await render();
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));

    copyButton().click();
    await tick();
    fixture.detectChanges();

    expect(copyStatus().textContent).toContain(MSG_COPY_FAIL);
    expect(copyButton().textContent).toContain('Copiar código Pix');
    const code = one('[data-pix-code]');
    expect(code.textContent?.trim()).toBe(buildPixCopyPasteCode('mp-pix-1-abc', 1000));
    expect(code.className).not.toContain('select-none');
  });

  it('copy failure (clipboard unavailable): shows the manual-copy message', async () => {
    await render();
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });

    copyButton().click();
    await tick();
    fixture.detectChanges();

    expect(copyStatus().textContent).toContain(MSG_COPY_FAIL);
  });

  it('approve: calls confirmPayment and navigates to /cofrinho/aprovado only after success', async () => {
    await render();

    approveMobile().click();
    fixture.detectChanges();
    expect(approveMobile().disabled).toBe(true);
    expect(approveDesktop().disabled).toBe(true);
    expect(failButton().disabled).toBe(true);
    expect(cancelButton().disabled).toBe(true);

    patch('/payments/pay-1').flush({ ...pendingPayment, status: 'PAID', paidAt: '2026-10-12T10:00:00.000Z' });
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

  it('the desktop approve button runs the same action', async () => {
    await render();

    approveDesktop().click();
    await flushApproval();

    expect(navigate).toHaveBeenCalledWith(['/cofrinho/aprovado']);
  });

  it('simulate failure: calls failPayment, navigates to /cofrinho/falha and keeps the balance', async () => {
    await render();

    failButton().click();
    fixture.detectChanges();
    const request = patch('/payments/pay-1');
    expect(request.request.body).toEqual({ status: 'FAILED' });
    expect(navigate).not.toHaveBeenCalled();
    request.flush({ ...pendingPayment, status: 'FAILED' });
    await settle();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/cofrinho/falha']);
    expect(service.wallet()?.tokenBalance).toBe(10);
    httpMock.expectNone((req) => req.url.includes('/wallets') && req.method === 'PATCH');
  });

  it('cancel: calls cancelOrder without confirmation and navigates to /cofrinho', async () => {
    await render();

    cancelButton().click();
    fixture.detectChanges();
    const request = patch('/orders/order-9');
    expect(request.request.body).toEqual({ status: 'CANCELLED' });
    request.flush({ ...pendingOrder, status: 'CANCELLED' });
    await settle();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/cofrinho']);
    expect(service.wallet()?.tokenBalance).toBe(10);
  });

  it('double click: a single call reaches the service, on every action', async () => {
    await render();

    approveMobile().click();
    fixture.componentInstance.approve();
    await fixture.componentInstance.approve();
    approveDesktop().click();
    fixture.detectChanges();
    const request = patch('/payments/pay-1');
    request.flush({ ...pendingPayment, status: 'PAID', paidAt: '2026-10-12T10:00:00.000Z' });
    await tick();
    patch('/orders/order-9').flush({ ...pendingOrder, status: 'COMPLETED' });
    await tick();
    patch('/wallets/wallet-1').flush({ ...baseWallet, tokenBalance: 15 });
    await settle();

    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('shares one lock across actions: while approving, fail and cancel are refused', async () => {
    await render();

    approveMobile().click();
    await fixture.componentInstance.simulateFailure();
    await fixture.componentInstance.cancel();
    fixture.detectChanges();

    httpMock.expectNone((req) => req.url.includes('/orders/'));
    const request = patch('/payments/pay-1');
    expect(request.request.body).toMatchObject({ status: 'PAID' });
    request.flush({ ...pendingPayment, status: 'PAID' });
    await tick();
    patch('/orders/order-9').flush({ ...pendingOrder, status: 'COMPLETED' });
    await tick();
    patch('/wallets/wallet-1').flush({ ...baseWallet, tokenBalance: 15 });
    await settle();

    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('network error on approve: shows the service message, does not navigate and retries the same action', async () => {
    await render();

    approveMobile().click();
    patch('/payments/pay-1').error(new ProgressEvent('error'));
    await settle();

    const alert = element.querySelector<HTMLElement>('[data-error][role="alert"]');
    expect(alert?.textContent).toContain(MSG_OFFLINE);
    expect(navigate).not.toHaveBeenCalled();
    expect(approveMobile().disabled).toBe(false);

    const retry = one<HTMLButtonElement>('[data-retry]');
    expect(retry.textContent?.trim()).toBe('Tentar novamente');
    retry.click();
    fixture.detectChanges();
    await flushApproval();

    expect(navigate).toHaveBeenCalledWith(['/cofrinho/aprovado']);
  });

  it('partial failure on approve (Order write fails): compensation message, no navigation, retry approves', async () => {
    await render();

    approveMobile().click();
    patch('/payments/pay-1').flush({ ...pendingPayment, status: 'PAID' });
    await tick();
    patch('/orders/order-9').error(new ProgressEvent('error'));
    await tick();
    patch('/payments/pay-1').flush({ ...pendingPayment, status: 'PENDING' });
    await settle();

    expect(element.querySelector('[data-error][role="alert"]')).not.toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    expect(service.wallet()?.tokenBalance).toBe(10);

    one<HTMLButtonElement>('[data-retry]').click();
    fixture.detectChanges();
    await flushApproval();

    expect(navigate).toHaveBeenCalledWith(['/cofrinho/aprovado']);
  });

  it('network error on simulate failure: "Tentar novamente" repeats failPayment, not approve', async () => {
    await render();

    failButton().click();
    patch('/payments/pay-1').error(new ProgressEvent('error'));
    await settle();
    expect(navigate).not.toHaveBeenCalled();

    one<HTMLButtonElement>('[data-retry]').click();
    fixture.detectChanges();
    const request = patch('/payments/pay-1');
    expect(request.request.body).toEqual({ status: 'FAILED' });
    request.flush({ ...pendingPayment, status: 'FAILED' });
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

  it('redirects to /cofrinho when there is no active order', async () => {
    await render({ activeOrderId: null });

    expect(navigate).toHaveBeenCalledWith(['/cofrinho']);
    expect(element.querySelector('[data-pix-code]')).toBeNull();
    expect(element.querySelector('[data-approve]')).toBeNull();
  });

  it('redirects to /cofrinho when the active order has no payment', async () => {
    await render({ payments: [] });

    expect(navigate).toHaveBeenCalledWith(['/cofrinho']);
    expect(element.querySelector('[data-pix-code]')).toBeNull();
  });

  it('redirects to /cofrinho when the order is not PENDING (ex.: back after approving)', async () => {
    await render({
      orders: [{ ...pendingOrder, status: 'COMPLETED' }],
      payments: [{ ...pendingPayment, status: 'PAID' }],
    });

    expect(navigate).toHaveBeenCalledWith(['/cofrinho']);
    expect(element.querySelector('[data-pix-code]')).toBeNull();
  });

  it('redirects to /cofrinho when the payment is not PENDING', async () => {
    await render({ payments: [{ ...pendingPayment, status: 'FAILED' }] });

    expect(navigate).toHaveBeenCalledWith(['/cofrinho']);
  });

  describe('after a successful action (page must not vanish)', () => {
    function expectContentRendered(): void {
      expect(element.querySelector('[data-pix-code]')).not.toBeNull();
      expect(element.querySelector('img[src$="qr-code.png"]')).not.toBeNull();
      expect(element.querySelector('[data-approve="mobile"]')).not.toBeNull();
      expect(element.querySelector('[data-cancel]')).not.toBeNull();
      expect(element.querySelector('[data-fail]')).not.toBeNull();
    }

    it('approve: content stays in the DOM right after the last PATCH, while navigation is pending', async () => {
      await render();
      navigate.mockReturnValue(new Promise<boolean>(() => undefined));

      approveMobile().click();
      await flushApproval();

      expectContentRendered();
    });

    it('simulate failure: content stays in the DOM while navigation is pending', async () => {
      await render();
      navigate.mockReturnValue(new Promise<boolean>(() => undefined));

      failButton().click();
      patch('/payments/pay-1').flush({ ...pendingPayment, status: 'FAILED' });
      await settle();

      expectContentRendered();
    });

    it('cancel: content stays in the DOM while navigation is pending', async () => {
      await render();
      navigate.mockReturnValue(new Promise<boolean>(() => undefined));

      cancelButton().click();
      patch('/orders/order-9').flush({ ...pendingOrder, status: 'CANCELLED' });
      await settle();

      expectContentRendered();
    });
  });

  describe('navigation failure after a successful action', () => {
    const MSG_NAV =
      'Não foi possível abrir a próxima tela. Volte ao Cofrinho para ver o seu pedido.';

    async function approveAndExpectNavigationFailure(): Promise<void> {
      approveMobile().click();
      await flushApproval();

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(element.querySelector('[data-pix-code]')).not.toBeNull();
      const alert = element.querySelector<HTMLElement>('[data-navigation-error][role="alert"]');
      expect(alert?.textContent).toContain(MSG_NAV);
      const back = alert?.querySelector<HTMLAnchorElement>('a[data-back-to-wallet]');
      expect(back?.getAttribute('href')).toBe('/cofrinho');
      expect(back?.className).toContain('min-h-11');
      expect(element.querySelector('[data-error]')).toBeNull();
      expect(element.querySelector('[data-retry]')).toBeNull();
      expect(fixture.componentInstance.submitting()).toBe(false);
    }

    it('navigate resolving false keeps the page and offers a way back to /cofrinho', async () => {
      await render();
      navigate.mockResolvedValue(false);

      await approveAndExpectNavigationFailure();
    });

    it('navigate rejecting (unknown route) keeps the page and offers a way back to /cofrinho', async () => {
      await render();
      navigate.mockRejectedValue(new Error('Cannot match any routes'));

      await approveAndExpectNavigationFailure();
    });

    it('does not navigate twice after the failure, even if an action is triggered again', async () => {
      await render();
      navigate.mockResolvedValue(false);
      approveMobile().click();
      await flushApproval();

      await fixture.componentInstance.approve();
      await fixture.componentInstance.cancel();
      await settle();

      httpMock.expectNone((req) => req.method === 'PATCH');
      expect(navigate).toHaveBeenCalledTimes(1);
    });
  });

  it('does not reload wallet data (no GET requests)', async () => {
    await render();

    httpMock.expectNone((req) => req.method === 'GET');
  });

  it('blocked account: shows the block message and refuses to approve', async () => {
    await render({ user: { ...activeUser, status: 'SUSPENDED' } });

    const alert = element.querySelector<HTMLElement>('[role="alert"]');
    expect(alert?.textContent).toContain(
      'Sua conta está suspensa e não pode realizar compras de fichas.',
    );
    expect(approveMobile().disabled).toBe(true);
    expect(approveDesktop().disabled).toBe(true);

    await fixture.componentInstance.approve();
    httpMock.expectNone((req) => req.method === 'PATCH');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows the amount only on desktop markup and has the sandbox box and back link', async () => {
    await render();

    expect(one('[data-amount]').className).toContain('hidden');
    expect(one('[data-amount]').textContent).toContain('Valor');
    expect(one('[data-amount]').textContent).toContain('R$ 10,00');
    const sandbox = one('[data-sandbox]');
    expect(sandbox.textContent).toContain('Ambiente de teste (sandbox)');
    expect(sandbox.className).toContain('border-dashed');
    expect(sandbox.contains(failButton())).toBe(true);
    expect(failButton().textContent).toContain('Simular falha / expiração');
    expect(cancelButton().textContent).toContain('Cancelar pedido');
    expect(one('[data-back]').getAttribute('href')).toBe('/cofrinho/pagamento');
  });

  it('uses <img> assets that exist in public/, a descriptive QR alt, decorative icons and no inline svg', async () => {
    await render();

    const images = Array.from(element.querySelectorAll('img'));
    const sources = images.map((image) => image.getAttribute('src') ?? '');
    expect(sources.some((src) => src.endsWith('qr-code.png'))).toBe(true);
    expect(sources.some((src) => src.endsWith('copy.svg'))).toBe(true);
    expect(sources.some((src) => src.endsWith('sync.svg'))).toBe(true);
    for (const image of images) {
      const src = image.getAttribute('src') ?? '';
      expect(publicFileExists(src), `missing public file for ${src}`).toBe(true);
      if (src.endsWith('.png')) {
        expect(image.getAttribute('alt')).toContain('QR Code');
        expect(image.getAttribute('aria-hidden')).toBeNull();
      } else {
        expect(image.getAttribute('alt')).toBe('');
        expect(image.getAttribute('aria-hidden')).toBe('true');
      }
    }
    expect(element.querySelector('svg')).toBeNull();
  });
});
