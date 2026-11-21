import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { merge } from 'rxjs';

import {
  formatBrlFromCents,
  TOKEN_UNIT_PRICE_CENTS,
  tokensToAmountCents,
} from '../../models/wallet.model';
import { WalletService } from '../../services/wallet.service';

type CardField = 'holder' | 'number' | 'expiry' | 'cvv';
type CardAction = 'create' | 'approve' | 'refuse' | 'cancel';

interface FieldConfig {
  name: CardField;
  id: string;
  label: string;
  autocomplete: string;
  inputmode: string | null;
  placeholder: string;
  wide: boolean;
}

/** Messages of the spec table; the keys are the error keys returned by the validators below. */
const CARD_MESSAGES: Record<CardField, Record<string, string>> = {
  holder: {
    required: 'Informe o nome do titular, como está no cartão.',
  },
  number: {
    required: 'Informe o número do cartão.',
    digits: 'Digite apenas números.',
    length: 'O número do cartão deve ter 16 dígitos.',
  },
  expiry: {
    required: 'Informe a validade do cartão.',
    format: 'Use o formato MM/AA, por exemplo 08/29.',
    month: 'Mês inválido. Use de 01 a 12.',
    expired: 'Este cartão está vencido.',
  },
  cvv: {
    required: 'Informe o código de segurança (CVV).',
    digits: 'Digite apenas números.',
    length: 'O CVV deve ter 3 ou 4 dígitos.',
  },
};

const CARD_NUMBER_LENGTH = 16;
const EXPIRY_PATTERN = /^(\d{2})\/(\d{2})$/;

function textOf(control: AbstractControl): string {
  return String(control.value ?? '');
}

const holderValidator: ValidatorFn = (control): ValidationErrors | null =>
  textOf(control).trim() === '' ? { required: true } : null;

const numberValidator: ValidatorFn = (control): ValidationErrors | null => {
  const digits = textOf(control).replace(/[\s-]/g, '');
  if (digits === '') {
    return { required: true };
  }
  if (/\D/.test(digits)) {
    return { digits: true };
  }
  return digits.length === CARD_NUMBER_LENGTH ? null : { length: true };
};

const expiryValidator: ValidatorFn = (control): ValidationErrors | null => {
  const value = textOf(control);
  if (value.trim() === '') {
    return { required: true };
  }
  const match = EXPIRY_PATTERN.exec(value);
  if (!match) {
    return { format: true };
  }
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) {
    return { month: true };
  }
  // Valid until the last day of the expiry month: expired from the first day of the next one.
  const firstDayAfterExpiry = new Date(year, month, 1);
  return new Date() >= firstDayAfterExpiry ? { expired: true } : null;
};

const cvvValidator: ValidatorFn = (control): ValidationErrors | null => {
  const value = textOf(control);
  if (value.trim() === '') {
    return { required: true };
  }
  if (/\D/.test(value)) {
    return { digits: true };
  }
  return value.length === 3 || value.length === 4 ? null : { length: true };
};

@Component({
  selector: 'app-card-payment',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './card-payment.page.html',
})
export class CardPaymentPage implements OnInit {
  private readonly walletService = inject(WalletService);
  private readonly router = inject(Router);

  readonly loading = this.walletService.loading;
  readonly error = this.walletService.error;
  readonly isAccountBlocked = this.walletService.isAccountBlocked;
  readonly accountBlockMessage = this.walletService.accountBlockMessage;

  readonly unitPriceLabel = formatBrlFromCents(TOKEN_UNIT_PRICE_CENTS);

  /** RNF06: card data lives only in this form; nothing here is ever passed to the service. */
  readonly form = new FormGroup({
    holder: new FormControl<string>('', { nonNullable: true, validators: [holderValidator] }),
    number: new FormControl<string>('', { nonNullable: true, validators: [numberValidator] }),
    expiry: new FormControl<string>('', { nonNullable: true, validators: [expiryValidator] }),
    cvv: new FormControl<string>('', { nonNullable: true, validators: [cvvValidator] }),
  });

  readonly fields: readonly FieldConfig[] = [
    {
      name: 'holder',
      id: 'card-holder',
      label: 'Nome do titular',
      autocomplete: 'cc-name',
      inputmode: null,
      placeholder: 'Como está no cartão',
      wide: true,
    },
    {
      name: 'number',
      id: 'card-number',
      label: 'Número do cartão',
      autocomplete: 'cc-number',
      inputmode: 'numeric',
      placeholder: '0000 0000 0000 0000',
      wide: true,
    },
    {
      name: 'expiry',
      id: 'card-expiry',
      label: 'Validade',
      autocomplete: 'cc-exp',
      inputmode: 'numeric',
      placeholder: 'MM/AA',
      wide: false,
    },
    {
      name: 'cvv',
      id: 'card-cvv',
      label: 'CVV',
      autocomplete: 'cc-csc',
      inputmode: 'numeric',
      placeholder: '123',
      wide: false,
    },
  ];

  /** Control state (touched, dirty, errors) is not a signal: every form event refreshes the computeds. */
  private readonly formEvents = toSignal(
    merge(this.form.events, ...Object.values(this.form.controls).map((control) => control.events)),
  );

  readonly errors = computed<Record<CardField, string | null>>(() => {
    this.formEvents();
    return {
      holder: this.messageFor('holder'),
      number: this.messageFor('number'),
      expiry: this.messageFor('expiry'),
      cvv: this.messageFor('cvv'),
    };
  });

  /** One lock shared by every action (service `loading` OR this page's `submitting`). */
  readonly submitting = signal(false);
  /** Set when the post-action navigation did not happen; the action itself already succeeded. */
  readonly navigationFailed = signal(false);
  readonly busy = computed<boolean>(
    () => this.loading() || this.submitting() || this.navigationFailed(),
  );

  private readonly lastAction = signal<CardAction | null>(null);

  /** Decided once in ngOnInit: Order/Payment leave PENDING after an action, the page must stay. */
  readonly ready = signal(false);

  private readonly order = this.walletService.activeOrder;

  /** Only a card payment counts: the active payment of a retried Order may still be a Pix one. */
  private readonly payment = computed(() => {
    const payment = this.walletService.activePayment();
    return payment?.method === 'CREDIT_CARD' ? payment : null;
  });

  private readonly hasPendingPayment = computed<boolean>(
    () => this.payment()?.status === 'PENDING',
  );

  private readonly tokensCount = computed<number>(
    () => this.order()?.tokensCount ?? this.walletService.draftTokensCount() ?? 0,
  );

  readonly tokensLabel = computed<string>(() => {
    const count = this.tokensCount();
    return `${count} ${count === 1 ? 'ficha' : 'fichas'}`;
  });

  readonly totalLabel = computed<string>(() =>
    formatBrlFromCents(this.order()?.amountCents ?? tokensToAmountCents(this.tokensCount())),
  );

  readonly processing = computed<boolean>(
    () => this.submitting() && this.lastAction() === 'approve',
  );

  readonly payLabel = computed<string>(() =>
    this.processing() ? 'Processando pagamento...' : `Pagar ${this.totalLabel()}`,
  );

  readonly canPay = computed<boolean>(() => {
    this.formEvents();
    return this.form.valid && this.hasPendingPayment() && !this.busy() && !this.isAccountBlocked();
  });

  readonly canRefuse = computed<boolean>(() => this.hasPendingPayment() && !this.busy());

  readonly canCancel = computed<boolean>(() => this.order()?.status === 'PENDING' && !this.busy());

  ngOnInit(): void {
    this.walletService.clearError();

    const order = this.order();
    if (order) {
      if (order.status !== 'PENDING') {
        void this.router.navigate(['/cofrinho']);
        return;
      }
    } else if (this.walletService.draftTokensCount() === null) {
      void this.router.navigate(['/cofrinho/comprar']);
      return;
    }

    this.ready.set(true);
    // A PENDING card payment of this Order is reused; otherwise the Payment (and Order) are created.
    if (!(order && this.hasPendingPayment())) {
      void this.run('create');
    }
  }

  /** Refuses invalid data even if `disabled` was bypassed or the form was submitted with Enter. */
  async pay(): Promise<void> {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();
    if (this.form.invalid) {
      return;
    }
    await this.run('approve');
  }

  simulateRefusal(): Promise<void> {
    return this.run('refuse');
  }

  cancel(): Promise<void> {
    return this.run('cancel');
  }

  /** Repeats the action that failed. */
  retry(): Promise<void> {
    const action = this.lastAction();
    if (action === null) {
      return Promise.resolve();
    }
    return action === 'approve' ? this.pay() : this.run(action);
  }

  private messageFor(field: CardField): string | null {
    const control = this.form.controls[field];
    if (!control.invalid || !(control.touched || control.dirty)) {
      return null;
    }
    const key = Object.keys(control.errors ?? {})[0];
    return CARD_MESSAGES[field][key] ?? null;
  }

  private async run(action: CardAction): Promise<void> {
    if (this.busy() || !this.canRun(action)) {
      return;
    }

    this.lastAction.set(action);
    this.submitting.set(true);
    try {
      const succeeded = await this.execute(action);
      if (!succeeded || action === 'create') {
        return;
      }
      if (action === 'approve') {
        // Success path only: on any error the typed data is kept.
        this.form.reset();
      }
      await this.goToDestination(action);
    } finally {
      this.submitting.set(false);
    }
  }

  private canRun(action: CardAction): boolean {
    switch (action) {
      case 'create':
        return true;
      case 'approve':
        return this.hasPendingPayment() && !this.isAccountBlocked();
      case 'refuse':
        return this.hasPendingPayment();
      case 'cancel':
        return this.order()?.status === 'PENDING';
    }
  }

  /** The server action is already done: a failed navigation must not look like a service error. */
  private async goToDestination(action: Exclude<CardAction, 'create'>): Promise<void> {
    let navigated = false;
    try {
      navigated = await this.router.navigate([this.destination(action)]);
    } catch {
      navigated = false;
    }
    if (!navigated) {
      this.navigationFailed.set(true);
    }
  }

  private async execute(action: CardAction): Promise<boolean> {
    const order = this.order();
    const payment = this.payment();

    switch (action) {
      case 'create': {
        if (order) {
          return (await this.walletService.createPaymentForOrder(order.id, 'CREDIT_CARD')) !== null;
        }
        const draft = this.walletService.draftTokensCount();
        if (draft === null) {
          return false;
        }
        return (await this.walletService.createOrderAndPayment(draft, 'CREDIT_CARD')) !== null;
      }
      case 'approve':
        return payment ? this.walletService.confirmPayment(payment.id) : false;
      case 'refuse':
        return payment ? this.walletService.failPayment(payment.id) : false;
      case 'cancel':
        return order ? this.walletService.cancelOrder(order.id) : false;
    }
  }

  private destination(action: Exclude<CardAction, 'create'>): string {
    switch (action) {
      case 'approve':
        return '/cofrinho/aprovado';
      case 'refuse':
        return '/cofrinho/falha';
      case 'cancel':
        return '/cofrinho';
    }
  }
}
