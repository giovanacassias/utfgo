import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { formatBrlFromCents, formatTokensLabel, Order, Payment, PaymentMethod } from '../../models/wallet.model';
import { WalletService } from '../../services/wallet.service';

type FailedAction = 'retry' | 'other' | 'cancel';

interface FailureTexts {
  reason: string;
  subtitle: string;
  pill: string;
  desktopHeadline: string;
}

const FAILURE_TEXTS: Record<PaymentMethod, FailureTexts> = {
  PIX: {
    reason: 'Tempo limite de pagamento excedido',
    subtitle: 'O código Pix expirou. Nenhuma cobrança foi realizada em sua conta.',
    pill: 'CÓDIGO EXPIRADO',
    desktopHeadline: 'O banco não confirmou o Pix dentro do prazo.',
  },
  CREDIT_CARD: {
    reason: 'Pagamento recusado pelo emissor do cartão',
    subtitle: 'O cartão foi recusado. Nenhuma cobrança foi realizada em sua conta.',
    pill: 'CARTÃO RECUSADO',
    desktopHeadline: 'O emissor do cartão não autorizou o pagamento.',
  },
};

/** Failure screen: every action works on the SAME Order; this page never creates an Order. */
@Component({
  selector: 'app-payment-failed',
  imports: [DatePipe, RouterLink],
  templateUrl: './payment-failed.page.html',
})
export class PaymentFailedPage implements OnInit {
  private readonly walletService = inject(WalletService);
  private readonly router = inject(Router);

  readonly loading = this.walletService.loading;
  readonly error = this.walletService.error;

  /**
   * Snapshot taken once in ngOnInit: a Pix retry creates a new active Payment, and the screen must keep
   * showing the failed attempt while it navigates away.
   */
  readonly order = signal<Order | null>(null);
  readonly payment = signal<Payment | null>(null);
  readonly ready = signal(false);

  readonly submitting = signal(false);
  /** Set when the post-action navigation did not happen; the action itself already succeeded. */
  readonly navigationFailed = signal(false);
  readonly busy = computed<boolean>(
    () => this.loading() || this.submitting() || this.navigationFailed(),
  );
  private readonly lastAction = signal<FailedAction | null>(null);

  readonly totalLabel = computed<string>(() => formatBrlFromCents(this.order()?.amountCents ?? 0));
  readonly quantityLabel = computed<string>(() => formatTokensLabel(this.order()?.tokensCount ?? 0));
  readonly texts =computed<FailureTexts>(
    () => FAILURE_TEXTS[this.payment()?.method ?? 'PIX'],
  );

  ngOnInit(): void {
    this.walletService.clearError();
    const order = this.walletService.activeOrder();
    const payment = this.walletService.activePayment();
    const ready = order?.status === 'PENDING' && payment?.status === 'FAILED';
    if (ready) {
      this.order.set(order);
      this.payment.set(payment);
    }
    this.ready.set(ready);
    if (!ready) {
      void this.router.navigate(['/cofrinho']);
    }
  }

  tryAgain(): Promise<void> {
    return this.run('retry');
  }

  chooseOtherMethod(): Promise<void> {
    return this.run('other');
  }

  cancel(): Promise<void> {
    return this.run('cancel');
  }

  /** Repeats the action that failed. */
  retry(): Promise<void> {
    const action = this.lastAction();
    return action === null ? Promise.resolve() : this.run(action);
  }

  private async run(action: FailedAction): Promise<void> {
    const order = this.order();
    const payment = this.payment();
    if (!order || !payment || this.busy()) {
      return;
    }

    this.lastAction.set(action);
    this.submitting.set(true);
    try {
      const destination = await this.execute(action, order.id, payment.method);
      if (destination !== null) {
        await this.goTo(destination);
      }
    } finally {
      this.submitting.set(false);
    }
  }

  /** Returns where to go, or null when the service action failed (the service already set the error). */
  private async execute(
    action: FailedAction,
    orderId: string,
    method: PaymentMethod,
  ): Promise<string | null> {
    switch (action) {
      case 'retry':
        if (method === 'CREDIT_CARD') {
          // The card page creates the new Payment when it opens.
          return '/cofrinho/cartao';
        }
        return (await this.walletService.createPaymentForOrder(orderId, 'PIX')) === null
          ? null
          : '/cofrinho/pix';
      case 'other':
        return '/cofrinho/pagamento';
      case 'cancel':
        return (await this.walletService.cancelOrder(orderId)) ? '/cofrinho' : null;
    }
  }

  private async goTo(destination: string): Promise<void> {
    let navigated = false;
    try {
      navigated = await this.router.navigate([destination]);
    } catch {
      navigated = false;
    }
    if (!navigated) {
      this.navigationFailed.set(true);
    }
  }
}
