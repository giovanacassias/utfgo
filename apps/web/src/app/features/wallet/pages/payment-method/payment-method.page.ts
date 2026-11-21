import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  formatBrlFromCents,
  PaymentMethod,
  TOKEN_UNIT_PRICE_CENTS,
  tokensToAmountCents,
} from '../../models/wallet.model';
import { WalletService } from '../../services/wallet.service';

interface PurchaseSource {
  /** Set only on a retry: the PENDING Order that receives a new Payment. */
  orderId: string | null;
  tokensCount: number;
  amountCents: number;
}

@Component({
  selector: 'app-payment-method',
  imports: [RouterLink],
  templateUrl: './payment-method.page.html',
})
export class PaymentMethodPage implements OnInit {
  private readonly walletService = inject(WalletService);
  private readonly router = inject(Router);

  readonly loading = this.walletService.loading;
  readonly error = this.walletService.error;
  readonly isAccountBlocked = this.walletService.isAccountBlocked;
  readonly accountBlockMessage = this.walletService.accountBlockMessage;

  readonly unitPriceLabel = formatBrlFromCents(TOKEN_UNIT_PRICE_CENTS);

  readonly method = signal<PaymentMethod>('PIX');
  readonly submitting = signal(false);

  /** A PENDING active Order (retry, CA10) wins over the draft (new purchase). */
  readonly source = computed<PurchaseSource | null>(() => {
    const order = this.walletService.activeOrder();
    if (order && order.status === 'PENDING') {
      return { orderId: order.id, tokensCount: order.tokensCount, amountCents: order.amountCents };
    }

    const draft = this.walletService.draftTokensCount();
    if (draft === null) {
      return null;
    }
    return { orderId: null, tokensCount: draft, amountCents: tokensToAmountCents(draft) };
  });

  readonly tokensLabel = computed<string>(() => {
    const count = this.source()?.tokensCount ?? 0;
    return `${count} ${count === 1 ? 'ficha' : 'fichas'}`;
  });

  readonly totalLabel = computed<string>(() => formatBrlFromCents(this.source()?.amountCents ?? 0));

  readonly canConfirm = computed<boolean>(
    () =>
      this.source() !== null && !this.isAccountBlocked() && !this.loading() && !this.submitting(),
  );

  readonly buttonLabel = computed<string>(() => {
    if (this.method() === 'CREDIT_CARD') {
      return 'Continuar com cartão';
    }
    return this.submitting() ? 'Gerando Pix...' : 'Confirmar e gerar Pix';
  });

  async ngOnInit(): Promise<void> {
    // Redirect only after the load settles: the PENDING Order may arrive with this request.
    await this.walletService.loadWalletData();
    if (this.source() === null) {
      void this.router.navigate(['/cofrinho/comprar']);
    }
  }

  isSelected(method: PaymentMethod): boolean {
    return this.method() === method;
  }

  selectMethod(method: PaymentMethod): void {
    if (this.isAccountBlocked()) {
      return;
    }
    this.method.set(method);
  }

  async confirm(): Promise<void> {
    const source = this.source();
    if (source === null || !this.canConfirm()) {
      return;
    }

    if (this.method() === 'CREDIT_CARD') {
      // TODO #2: /cofrinho/cartao is created in task 8 and creates the Payment there.
      void this.router.navigate(['/cofrinho/cartao']);
      return;
    }

    this.submitting.set(true);
    try {
      const result =
        source.orderId !== null
          ? await this.walletService.createPaymentForOrder(source.orderId, 'PIX')
          : await this.walletService.createOrderAndPayment(source.tokensCount, 'PIX');

      if (result !== null) {
        // TODO #2: Pix page (/cofrinho/pix) is the task 7 page; replace with the NestJS-backed flow.
        void this.router.navigate(['/cofrinho/pix']);
      }
    } finally {
      this.submitting.set(false);
    }
  }

  optionClasses(method: PaymentMethod): string {
    return this.isSelected(method)
      ? 'border-primary bg-warning-surface'
      : 'border-border bg-background';
  }
}
