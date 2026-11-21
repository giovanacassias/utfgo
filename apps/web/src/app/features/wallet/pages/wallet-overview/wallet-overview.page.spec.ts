import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import {
  formatBrlFromCents,
  Order,
  Payment,
  StatementFilter,
  TOKEN_UNIT_PRICE_CENTS,
  User,
  Wallet,
  WalletTransaction,
} from '../../models/wallet.model';
import { WalletService } from '../../services/wallet.service';
import { WalletOverviewPage } from './wallet-overview.page';

function buildTransaction(
  orderId: string,
  status: Order['status'],
  tokensCount: number,
  paymentStatus: Payment['status'] | null,
  method: Payment['method'] = 'PIX',
): WalletTransaction {
  const order: Order = {
    id: orderId,
    userId: 'user-1',
    tokensCount,
    amountCents: tokensCount * 200,
    status,
    createdAt: '2026-10-10T14:26:00.000Z',
  };
  const latestPayment: Payment | null = paymentStatus
    ? {
        id: `pay-${orderId}`,
        orderId,
        gatewayPaymentId: `mp-${orderId}`,
        method,
        amountCents: tokensCount * 200,
        status: paymentStatus,
        paidAt: null,
        createdAt: '2026-10-10T14:26:00.000Z',
      }
    : null;

  return { order, payments: latestPayment ? [latestPayment] : [], latestPayment };
}

describe('WalletOverviewPage', () => {
  const user = signal<User | null>(null);
  const wallet = signal<Wallet | null>(null);
  const transactions = signal<WalletTransaction[]>([]);
  const filtered = signal<WalletTransaction[]>([]);
  const statementFilter = signal<StatementFilter>('ALL');
  const loading = signal(false);
  const error = signal<string | null>(null);
  const isAccountBlocked = signal(false);
  const accountBlockMessage = signal<string | null>(null);
  const walletBalanceCents = signal(0);

  const loadWalletData = vi.fn();
  const setStatementFilter = vi.fn();
  const selectActiveOrder = vi.fn();
  const cancelOrder = vi.fn();

  let element: HTMLElement;
  let navigate: ReturnType<typeof vi.spyOn>;

  async function render(): Promise<void> {
    const fixture = TestBed.createComponent(WalletOverviewPage);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function button(label: string): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll('button')).find((item) =>
      item.textContent?.includes(label),
    );
  }

  beforeEach(() => {
    user.set({
      id: 'user-1',
      email: 'caio@alunos.utfpr.edu.br',
      name: 'Caio',
      role: 'PASSENGER',
      status: 'ACTIVE',
      createdAt: '2026-10-01T10:00:00.000Z',
    });
    wallet.set({
      id: 'wallet-1',
      userId: 'user-1',
      tokenBalance: 8,
      penaltyPoints: 0,
      updatedAt: '2026-10-10T14:26:00.000Z',
    });
    walletBalanceCents.set(1600);
    transactions.set([]);
    filtered.set([]);
    statementFilter.set('ALL');
    loading.set(false);
    error.set(null);
    isAccountBlocked.set(false);
    accountBlockMessage.set(null);
    loadWalletData.mockReset().mockResolvedValue(undefined);
    setStatementFilter.mockReset();
    selectActiveOrder.mockReset();
    cancelOrder.mockReset().mockResolvedValue(true);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: WalletService,
          useValue: {
            user: user.asReadonly(),
            wallet: wallet.asReadonly(),
            transactions: transactions.asReadonly(),
            filteredTransactions: filtered.asReadonly(),
            statementFilter: statementFilter.asReadonly(),
            loading: loading.asReadonly(),
            error: error.asReadonly(),
            isAccountBlocked: isAccountBlocked.asReadonly(),
            accountBlockMessage: accountBlockMessage.asReadonly(),
            walletBalanceCents: walletBalanceCents.asReadonly(),
            loadWalletData,
            setStatementFilter,
            selectActiveOrder,
            cancelOrder,
          },
        },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  it('loads wallet data once on init', async () => {
    await render();

    expect(loadWalletData).toHaveBeenCalledTimes(1);
  });

  it('shows balance in tokens and BRL, the fixed rate and the buy action (CA1)', async () => {
    await render();

    expect(element.querySelector('[data-wallet-balance]')?.textContent).toContain('8 fichas');
    expect(element.querySelector('[data-wallet-balance-brl]')?.textContent).toContain('R$ 16,00');
    expect(element.textContent).toContain('1 ficha = R$ 2,00');
    const buy = element.querySelector<HTMLAnchorElement>('a[href="/cofrinho/comprar"]');
    expect(buy?.textContent).toContain('Comprar fichas');
  });

  it('derives the rate label from the tariff constants and renders it in both places', async () => {
    const fixture = TestBed.createComponent(WalletOverviewPage);
    fixture.detectChanges();
    await fixture.whenStable();
    const expected = `1 ficha = ${formatBrlFromCents(TOKEN_UNIT_PRICE_CENTS)}`;
    const host = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.rateLabel).toBe(expected);
    const occurrences = host.textContent?.split(expected).length ?? 0;
    expect(occurrences - 1).toBe(2);
  });

  it('shows the "Valor por viagem" card with the fixed rate and no-fee note (Figma desktop)', async () => {
    await render();

    const card = element.querySelector('[data-rate-card]');
    expect(card?.textContent).toContain('Valor por viagem');
    expect(card?.textContent).toContain('1 ficha = R$ 2,00');
    expect(card?.textContent).toContain('Sem taxa comercial');
  });

  it('shows the decorative piggy bank image hidden from assistive tech', async () => {
    await render();

    const images = element.querySelectorAll('img[data-piggy-bank]');
    expect(images.length).toBeGreaterThan(0);
    for (const image of Array.from(images)) {
      expect(image.getAttribute('src')).toContain('cofrinho.png');
      expect(image.getAttribute('alt')).toBe('');
      expect(image.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('keeps "Doar fichas" disabled with an "Em breve" hint (assumption 5)', async () => {
    await render();

    const donate = button('Doar fichas');
    expect(donate?.disabled).toBe(true);
    expect(donate?.textContent).toContain('Em breve');
    expect(donate?.querySelector('[data-coming-soon]')?.textContent?.trim()).toBe('Em breve');
  });

  it('renders the balance number and unit separately but readable as "N fichas"', async () => {
    await render();

    const balance = element.querySelector('[data-wallet-balance]');
    expect(balance?.querySelector('[data-wallet-balance-amount]')?.textContent?.trim()).toBe('8');
    expect(balance?.querySelector('[data-wallet-balance-unit]')?.textContent?.trim()).toBe(
      'fichas',
    );
    expect(balance?.textContent?.replace(/\s+/g, ' ').trim()).toBe('8 fichas');
  });

  it('uses the singular unit for a balance of 1 token', async () => {
    wallet.update((current) => (current ? { ...current, tokenBalance: 1 } : current));
    await render();

    const balance = element.querySelector('[data-wallet-balance]');
    expect(balance?.textContent?.replace(/\s+/g, ' ').trim()).toBe('1 ficha');
  });

  it('shows an informative empty state when there are no orders (CA1)', async () => {
    await render();

    expect(element.querySelector('[data-statement-empty]')).not.toBeNull();
    expect(element.querySelectorAll('[data-statement-item]').length).toBe(0);
  });

  it('lists the filtered transactions in the given order with tokens and BRL (CA1)', async () => {
    const list = [
      buildTransaction('order-2', 'COMPLETED', 5, 'PAID'),
      buildTransaction('order-1', 'COMPLETED', 1, 'PAID', 'CREDIT_CARD'),
    ];
    transactions.set(list);
    filtered.set(list);
    await render();

    const items = Array.from(element.querySelectorAll('[data-statement-item]'));
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('5 fichas');
    expect(items[0].textContent).toContain('R$ 10,00');
    expect(items[0].textContent).toContain('Pix');
    expect(items[1].textContent).toContain('1 ficha');
    expect(items[1].textContent).toContain('Cartão');
    expect(element.querySelector('[data-statement-empty]')).toBeNull();
  });

  it('renders the four filters and delegates to setStatementFilter without reloading (CA2)', async () => {
    await render();

    const labels = Array.from(element.querySelectorAll('[data-statement-filter]')).map((item) =>
      item.textContent?.trim(),
    );
    expect(labels).toEqual(['Todas', 'Concluídas', 'Pendentes', 'Falhas/Canceladas']);

    button('Concluídas')?.click();
    button('Pendentes')?.click();
    button('Falhas/Canceladas')?.click();
    button('Todas')?.click();

    expect(setStatementFilter.mock.calls).toEqual([
      ['COMPLETED'],
      ['PENDING'],
      ['FAILED_OR_CANCELLED'],
      ['ALL'],
    ]);
    expect(loadWalletData).toHaveBeenCalledTimes(1);
  });

  it('marks the active filter and keeps the balance visible when the filter changes (CA2)', async () => {
    statementFilter.set('PENDING');
    await render();

    expect(button('Pendentes')?.getAttribute('aria-pressed')).toBe('true');
    expect(button('Todas')?.getAttribute('aria-pressed')).toBe('false');
    expect(element.querySelector('[data-wallet-balance]')?.textContent).toContain('8 fichas');
  });

  it('shows a filter-specific message when the filter has no results', async () => {
    transactions.set([buildTransaction('order-1', 'COMPLETED', 1, 'PAID')]);
    filtered.set([]);
    statementFilter.set('PENDING');
    await render();

    expect(element.querySelector('[data-statement-empty]')).not.toBeNull();
  });

  it('offers resume and cancel only for PENDING orders', async () => {
    const list = [
      buildTransaction('order-2', 'PENDING', 3, 'FAILED'),
      buildTransaction('order-1', 'COMPLETED', 1, 'PAID'),
    ];
    transactions.set(list);
    filtered.set(list);
    await render();

    const items = Array.from(element.querySelectorAll('[data-statement-item]'));
    expect(items[0].textContent).toContain('Cancelar pedido');
    expect(items[0].textContent).toContain('Retomar pagamento');
    expect(items[1].textContent).not.toContain('Cancelar pedido');
    expect(items[1].textContent).not.toContain('Retomar pagamento');
  });

  it('cancels a PENDING order through the service (CA11)', async () => {
    const list = [buildTransaction('order-2', 'PENDING', 3, 'PENDING')];
    transactions.set(list);
    filtered.set(list);
    await render();

    button('Cancelar pedido')?.click();

    expect(cancelOrder).toHaveBeenCalledWith('order-2');
  });

  it('resumes a PENDING order selecting it and asking to navigate to the payment step', async () => {
    const list = [buildTransaction('order-2', 'PENDING', 3, 'FAILED')];
    transactions.set(list);
    filtered.set(list);
    await render();

    button('Retomar pagamento')?.click();

    expect(selectActiveOrder).toHaveBeenCalledWith('order-2');
    expect(navigate).toHaveBeenCalledWith(['/cofrinho/pagamento']);
  });

  it('blocks purchase and shows the account message for SUSPENDED/BANNED users (CA13)', async () => {
    isAccountBlocked.set(true);
    accountBlockMessage.set('Sua conta está suspensa e não pode realizar compras de fichas.');
    await render();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('suspensa');
    expect(element.querySelector('a[href="/cofrinho/comprar"]')).toBeNull();
    expect(button('Comprar fichas')?.disabled).toBe(true);
  });

  it('blocks resume for blocked accounts', async () => {
    isAccountBlocked.set(true);
    accountBlockMessage.set('Sua conta está banida e não pode realizar compras de fichas.');
    const list = [buildTransaction('order-2', 'PENDING', 3, 'FAILED')];
    transactions.set(list);
    filtered.set(list);
    await render();

    expect(button('Retomar pagamento')?.disabled).toBe(true);
  });

  it('shows a friendly error with retry that reloads the wallet (CA14)', async () => {
    error.set('Não foi possível conectar ao servidor da carteira. Verifique sua conexão.');
    await render();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Não foi possível conectar',
    );
    expect(loadWalletData).toHaveBeenCalledTimes(1);

    button('Tentar novamente')?.click();

    expect(loadWalletData).toHaveBeenCalledTimes(2);
  });

  it('does not show a false balance when the wallet failed to load (CA14)', async () => {
    wallet.set(null);
    error.set('Não foi possível carregar os dados da carteira. Tente novamente.');
    await render();

    expect(element.querySelector('[data-wallet-balance]')).toBeNull();
  });

  it('shows a loading indicator while loading', async () => {
    loading.set(true);
    await render();

    expect(element.querySelector('[data-wallet-loading]')).not.toBeNull();
  });

  it('announces the loading indicator to screen readers', async () => {
    loading.set(true);
    await render();

    expect(element.querySelector('[data-wallet-loading]')?.getAttribute('role')).toBe('status');
  });

  it('keeps minimum touch target and visible focus on interactive controls', async () => {
    error.set('Falha ao carregar.');
    const list = [buildTransaction('order-2', 'PENDING', 3, 'FAILED')];
    transactions.set(list);
    filtered.set(list);
    await render();

    const back = element.querySelector('a[aria-label="Voltar"]');
    expect(back?.classList.contains('min-h-11')).toBe(true);
    expect(back?.classList.contains('min-w-11')).toBe(true);

    const controls = Array.from(element.querySelectorAll('a, button'));
    for (const control of controls) {
      expect(control.classList.contains('focus-visible:outline-2')).toBe(true);
      expect(control.classList.contains('focus-visible:outline-tertiary')).toBe(true);
    }
  });
});
