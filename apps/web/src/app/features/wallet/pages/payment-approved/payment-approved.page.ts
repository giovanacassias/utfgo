import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { formatBrlFromCents, formatTokensLabel, TOKEN_UNIT_PRICE_CENTS } from '../../models/wallet.model';
import { WalletService } from '../../services/wallet.service';

/** Read-only receipt: it only reads the active Order/Payment and the Wallet, it never writes. */
@Component({
  selector: 'app-payment-approved',
  imports: [DatePipe, RouterLink],
  templateUrl: './payment-approved.page.html',
})
export class PaymentApprovedPage implements OnInit {
  private readonly walletService = inject(WalletService);
  private readonly router = inject(Router);

  readonly order = this.walletService.activeOrder;
  readonly payment = this.walletService.activePayment;
  readonly wallet = this.walletService.wallet;

  /** Decided once in ngOnInit (ex.: F5 clears the state, so there is no receipt to show). */
  readonly ready = signal(false);
  readonly submitting = signal(false);
  /** Set when the navigation did not happen. */
  readonly navigationFailed = signal(false);
  readonly busy = computed<boolean>(() => this.submitting() || this.navigationFailed());

  readonly unitPriceLabel = formatBrlFromCents(TOKEN_UNIT_PRICE_CENTS);
  readonly totalLabel = computed<string>(() => formatBrlFromCents(this.order()?.amountCents ?? 0));
  readonly quantityLabel = computed<string>(() => formatTokensLabel(this.order()?.tokensCount ?? 0));
  readonly balanceLabel = computed<string>(() => formatTokensLabel(this.wallet()?.tokenBalance ?? 0));
  readonly isPix =computed<boolean>(() => this.payment()?.method === 'PIX');
  readonly methodLabel = computed<string>(() => (this.isPix() ? 'Pix' : 'Cartão'));
  readonly pillLabel = computed<string>(() => (this.isPix() ? 'PIX VALIDADO' : 'CARTÃO APROVADO'));

  ngOnInit(): void {
    this.ready.set(this.order()?.status === 'COMPLETED' && this.payment()?.status === 'PAID');
    if (!this.ready()) {
      void this.router.navigate(['/cofrinho']);
    }
  }

  async goToWallet(): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.submitting.set(true);
    try {
      let navigated = false;
      try {
        navigated = await this.router.navigate(['/cofrinho']);
      } catch {
        navigated = false;
      }
      if (!navigated) {
        this.navigationFailed.set(true);
      }
    } finally {
      this.submitting.set(false);
    }
  }
}
