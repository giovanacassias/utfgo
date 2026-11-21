import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  formatBrlFromCents,
  Payment,
  StatementFilter,
  TOKEN_UNIT_PRICE_CENTS,
  WalletTransaction,
} from '../../models/wallet.model';
import { WalletService } from '../../services/wallet.service';

interface StatementFilterOption {
  value: StatementFilter;
  label: string;
}

@Component({
  selector: 'app-wallet-overview',
  imports: [DatePipe, NgTemplateOutlet, RouterLink],
  templateUrl: './wallet-overview.page.html',
})
export class WalletOverviewPage implements OnInit {
  private readonly walletService = inject(WalletService);
  private readonly router = inject(Router);

  readonly wallet = this.walletService.wallet;
  readonly walletBalanceCents = this.walletService.walletBalanceCents;
  readonly transactions = this.walletService.transactions;
  readonly filteredTransactions = this.walletService.filteredTransactions;
  readonly statementFilter = this.walletService.statementFilter;
  readonly loading = this.walletService.loading;
  readonly error = this.walletService.error;
  readonly isAccountBlocked = this.walletService.isAccountBlocked;
  readonly accountBlockMessage = this.walletService.accountBlockMessage;

  readonly rateLabel = `1 ficha = ${formatBrlFromCents(TOKEN_UNIT_PRICE_CENTS)}`;

  readonly filters: readonly StatementFilterOption[] = [
    { value: 'ALL', label: 'Todas' },
    { value: 'COMPLETED', label: 'Concluídas' },
    { value: 'PENDING', label: 'Pendentes' },
    { value: 'FAILED_OR_CANCELLED', label: 'Falhas/Canceladas' },
  ];

  ngOnInit(): void {
    void this.walletService.loadWalletData();
  }

  filterClasses(active: boolean): string {
    return active
      ? 'border-secondary bg-secondary text-on-tertiary lg:border-warning-surface lg:bg-warning-surface lg:text-text-primary'
      : 'border-border bg-background text-text-primary lg:border-surface-muted lg:bg-surface-muted lg:text-text-secondary';
  }

  retry(): void {
    void this.walletService.loadWalletData();
  }

  selectFilter(filter: StatementFilter): void {
    this.walletService.setStatementFilter(filter);
  }

  cancelOrder(orderId: string): void {
    void this.walletService.cancelOrder(orderId);
  }

  resumeOrder(orderId: string): void {
    this.walletService.selectActiveOrder(orderId);
    // TODO #2: /cofrinho/pagamento is created in task 6; resume always returns to method selection.
    void this.router.navigate(['/cofrinho/pagamento']);
  }

  formatBrl(amountCents: number): string {
    return formatBrlFromCents(amountCents);
  }

  tokensLabel(tokensCount: number): string {
    return `${tokensCount} ${tokensCount === 1 ? 'ficha' : 'fichas'}`;
  }

  tokensUnit(tokensCount: number): string {
    return tokensCount === 1 ? 'ficha' : 'fichas';
  }

  title(transaction: WalletTransaction): string {
    return `Compra de fichas (${this.methodLabel(transaction.latestPayment)})`;
  }

  statusLabel(transaction: WalletTransaction): string {
    switch (transaction.order.status) {
      case 'COMPLETED':
        return 'Concluída';
      case 'CANCELLED':
        return 'Cancelada';
      case 'PENDING':
        return transaction.latestPayment?.status === 'FAILED' ? 'Falha no pagamento' : 'Pendente';
    }
  }

  private methodLabel(payment: Payment | null): string {
    if (payment?.method === 'PIX') {
      return 'Pix';
    }
    if (payment?.method === 'CREDIT_CARD') {
      return 'Cartão';
    }
    return 'pedido';
  }
}
