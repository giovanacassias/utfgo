import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import {
  formatBrlFromCents,
  MAX_TOKENS_PER_ORDER,
  MIN_TOKENS_PER_ORDER,
  TOKEN_PACKAGES,
  TOKEN_UNIT_PRICE_CENTS,
  tokensToAmountCents,
  User,
  Wallet,
} from '../../models/wallet.model';
import { WalletService } from '../../services/wallet.service';
import { BuyTokensPage } from './buy-tokens.page';

const MSG_REQUIRED = 'Escolha um pacote ou informe uma quantidade.';
const MSG_MIN = `A quantidade mínima é ${MIN_TOKENS_PER_ORDER} ficha.`;
const MSG_INTEGER = 'Informe um número inteiro, sem vírgula ou ponto.';
const MSG_TEXT = 'Digite apenas números.';
const MSG_MAX = `A quantidade máxima por pedido é ${MAX_TOKENS_PER_ORDER} fichas.`;

describe('BuyTokensPage', () => {
  const user = signal<User | null>(null);
  const wallet = signal<Wallet | null>(null);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const isAccountBlocked = signal(false);
  const accountBlockMessage = signal<string | null>(null);
  const draftTokensCount = signal<number | null>(null);

  const loadWalletData = vi.fn();
  const setDraftTokensCount = vi.fn();

  let fixture: ComponentFixture<BuyTokensPage>;
  let element: HTMLElement;
  let navigate: ReturnType<typeof vi.spyOn>;

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(BuyTokensPage);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function packageButtons(): HTMLButtonElement[] {
    return Array.from(element.querySelectorAll<HTMLButtonElement>('[data-package]'));
  }

  function packageButton(tokensCount: number): HTMLButtonElement {
    const found = packageButtons().find((item) => item.dataset['package'] === String(tokensCount));
    if (!found) {
      throw new Error(`package ${tokensCount} not found`);
    }
    return found;
  }

  function customInput(): HTMLInputElement {
    return element.querySelector<HTMLInputElement>('[data-custom-input]') as HTMLInputElement;
  }

  function submitButton(): HTMLButtonElement {
    return element.querySelector<HTMLButtonElement>('[data-submit]') as HTMLButtonElement;
  }

  function errorAlert(): HTMLElement | null {
    return element.querySelector<HTMLElement>('[data-custom-field] [role="alert"]');
  }

  async function typeCustom(value: string): Promise<void> {
    const input = customInput();
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await settle();
  }

  async function submitForm(): Promise<void> {
    const form = element.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await settle();
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
      tokenBalance: 10,
      penaltyPoints: 0,
      updatedAt: '2026-10-10T14:26:00.000Z',
    });
    loading.set(false);
    error.set(null);
    isAccountBlocked.set(false);
    accountBlockMessage.set(null);
    draftTokensCount.set(null);
    loadWalletData.mockReset().mockResolvedValue(undefined);
    setDraftTokensCount.mockReset();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: WalletService,
          useValue: {
            user: user.asReadonly(),
            wallet: wallet.asReadonly(),
            loading: loading.asReadonly(),
            error: error.asReadonly(),
            isAccountBlocked: isAccountBlocked.asReadonly(),
            accountBlockMessage: accountBlockMessage.asReadonly(),
            draftTokensCount: draftTokensCount.asReadonly(),
            loadWalletData,
            setDraftTokensCount,
          },
        },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  it('loads wallet data once on init and shows the current balance', async () => {
    await render();

    expect(loadWalletData).toHaveBeenCalledTimes(1);
    expect(element.textContent).toContain('10 fichas');
  });

  it('renders one option per token package, with the exact price (CA3)', async () => {
    await render();

    expect(packageButtons().map((item) => item.dataset['package'])).toEqual(
      TOKEN_PACKAGES.map(String),
    );
    for (const tokensCount of TOKEN_PACKAGES) {
      expect(packageButton(tokensCount).textContent).toContain(
        formatBrlFromCents(tokensToAmountCents(tokensCount)),
      );
    }
  });

  it('opens with only a neutral hint, no error alert, and the submit blocked', async () => {
    await render();

    expect(element.textContent).toContain(MSG_REQUIRED);
    expect(errorAlert()).toBeNull();
    expect(element.querySelector('[data-hint]')).not.toBeNull();
    expect(submitButton().disabled).toBe(true);
    expect(packageButtons().every((item) => item.getAttribute('aria-checked') === 'false')).toBe(
      true,
    );
  });

  it('highlights the chosen package in tertiary, shows quantity and exact total, enables submit (CA3)', async () => {
    await render();

    packageButton(5).click();
    await settle();

    expect(packageButton(5).getAttribute('aria-checked')).toBe('true');
    expect(packageButton(5).className).toContain('bg-tertiary');
    expect(packageButton(1).className).not.toContain('bg-tertiary');
    expect(element.querySelector('[data-summary-quantity]')?.textContent).toContain('5 fichas');
    expect(element.querySelector('[data-summary-total]')?.textContent).toContain('R$ 10,00');
    expect(element.querySelector('[data-summary-unit]')?.textContent).toContain(
      formatBrlFromCents(TOKEN_UNIT_PRICE_CENTS),
    );
    expect(submitButton().disabled).toBe(false);
    expect(element.querySelector('[data-hint]')).toBeNull();
    expect(element.textContent).not.toContain('SELECIONADO');
  });

  it('accepts a valid custom quantity, recalculates the total and clears the fixed package (CA4)', async () => {
    await render();
    packageButton(10).click();
    await settle();

    await typeCustom('8');

    expect(element.querySelector('[data-summary-quantity]')?.textContent).toContain('8 fichas');
    expect(element.querySelector('[data-summary-total]')?.textContent).toContain('R$ 16,00');
    expect(packageButtons().every((item) => item.getAttribute('aria-checked') === 'false')).toBe(
      true,
    );
    expect(errorAlert()).toBeNull();
    expect(submitButton().disabled).toBe(false);
  });

  it('accepts the boundaries 1 and 100', async () => {
    await render();

    await typeCustom('1');
    expect(submitButton().disabled).toBe(false);
    expect(element.querySelector('[data-summary-total]')?.textContent).toContain('R$ 2,00');

    await typeCustom('100');
    expect(submitButton().disabled).toBe(false);
    expect(element.querySelector('[data-summary-total]')?.textContent).toContain('R$ 200,00');
  });

  it('clears the custom field when a package is chosen (mutual exclusion)', async () => {
    await render();
    await typeCustom('8');

    packageButton(20).click();
    await settle();

    expect(customInput().value).toBe('');
    expect(element.querySelector('[data-summary-quantity]')?.textContent).toContain('20 fichas');
    expect(element.querySelector('[data-summary-total]')?.textContent).toContain('R$ 40,00');
    expect(errorAlert()).toBeNull();
  });

  it.each([
    ['0', MSG_MIN],
    ['-3', MSG_MIN],
    ['1.5', MSG_INTEGER],
    ['1,5', MSG_INTEGER],
    ['abc', MSG_TEXT],
    ['12abc', MSG_TEXT],
    ['101', MSG_MAX],
  ])('blocks custom value "%s" with a clear alert message (CA5)', async (value, message) => {
    await render();

    await typeCustom(value);

    const alert = errorAlert();
    expect(alert?.textContent).toContain(message);
    expect(alert?.className).toContain('text-danger');
    expect(submitButton().disabled).toBe(true);
    expect(element.querySelector('[data-summary-total]')?.textContent).not.toContain('R$ 2');
  });

  it('shows the required message only after the field is touched and left empty (CA5)', async () => {
    await render();
    expect(errorAlert()).toBeNull();

    customInput().dispatchEvent(new Event('blur'));
    await settle();

    expect(errorAlert()?.textContent).toContain(MSG_REQUIRED);
    expect(submitButton().disabled).toBe(true);
  });

  it('shows the required message again when the typed value is erased (CA5)', async () => {
    await render();
    await typeCustom('8');

    await typeCustom('');

    expect(errorAlert()?.textContent).toContain(MSG_REQUIRED);
    expect(submitButton().disabled).toBe(true);
  });

  it('refuses to advance with an invalid quantity even if submit is forced', async () => {
    await render();
    await typeCustom('abc');

    await submitForm();

    expect(setDraftTokensCount).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('refuses to advance with nothing chosen', async () => {
    await render();

    await submitForm();

    expect(setDraftTokensCount).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('saves the draft and then navigates to /cofrinho/pagamento with a package', async () => {
    await render();
    const order: string[] = [];
    setDraftTokensCount.mockImplementation(() => order.push('draft'));
    navigate.mockImplementation(() => {
      order.push('navigate');
      return Promise.resolve(true);
    });

    packageButton(10).click();
    await settle();
    submitButton().click();
    await settle();

    expect(setDraftTokensCount).toHaveBeenCalledWith(10);
    expect(navigate).toHaveBeenCalledWith(['/cofrinho/pagamento']);
    expect(order).toEqual(['draft', 'navigate']);
  });

  it('saves the custom quantity as draft and navigates when submitted with Enter (CA4)', async () => {
    await render();
    await typeCustom('8');

    await submitForm();

    expect(setDraftTokensCount).toHaveBeenCalledWith(8);
    expect(navigate).toHaveBeenCalledWith(['/cofrinho/pagamento']);
  });

  it('blocks a SUSPENDED/BANNED account: message, disabled choices and no advance (CA13)', async () => {
    isAccountBlocked.set(true);
    accountBlockMessage.set('Sua conta está suspensa e não pode realizar compras de fichas.');
    await render();

    const alert = element.querySelector('[data-account-blocked]');
    expect(alert?.getAttribute('role')).toBe('alert');
    expect(alert?.textContent).toContain(
      'Sua conta está suspensa e não pode realizar compras de fichas.',
    );
    expect(packageButtons().every((item) => item.disabled)).toBe(true);
    expect(customInput().disabled).toBe(true);
    expect(submitButton().disabled).toBe(true);

    await submitForm();
    expect(setDraftTokensCount).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('refuses to advance when the account becomes blocked after a valid choice', async () => {
    await render();
    packageButton(5).click();
    await settle();

    isAccountBlocked.set(true);
    accountBlockMessage.set('Sua conta está banida e não pode realizar compras de fichas.');
    await settle();
    await submitForm();

    expect(submitButton().disabled).toBe(true);
    expect(setDraftTokensCount).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('keeps submit blocked and refuses to advance while loading', async () => {
    await render();
    packageButton(5).click();
    await settle();

    loading.set(true);
    await settle();
    expect(submitButton().disabled).toBe(true);

    await submitForm();
    expect(setDraftTokensCount).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('exposes the lower and upper limits only through the tariff constants', async () => {
    await render();

    await typeCustom(String(MAX_TOKENS_PER_ORDER + 1));
    expect(errorAlert()?.textContent).toContain(MSG_MAX);

    await typeCustom(String(MIN_TOKENS_PER_ORDER - 1));
    expect(errorAlert()?.textContent).toContain(MSG_MIN);
  });
});
