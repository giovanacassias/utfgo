import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { buildPixCopyPasteCode, formatBrlFromCents } from '../../models/wallet.model';
import { WalletService } from '../../services/wallet.service';

type PixAction = 'approve' | 'fail' | 'cancel';
type CopyState = 'idle' | 'copied' | 'failed';

const COPIED_FEEDBACK_MS = 2000;
const COPY_FAILED_MESSAGE = 'Não foi possível copiar. Selecione o código e copie manualmente.';

@Component({
  selector: 'app-pix-payment',
  imports: [RouterLink],
  templateUrl: './pix-payment.page.html',
})
export class PixPaymentPage implements OnInit {
  private readonly walletService = inject(WalletService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = this.walletService.loading;
  readonly error = this.walletService.error;
  readonly isAccountBlocked = this.walletService.isAccountBlocked;
  readonly accountBlockMessage = this.walletService.accountBlockMessage;

  /** One lock shared by the three actions (service `loading` OR this page's `submitting`). */
  readonly submitting = signal(false);
  /** Set when the post-action navigation did not happen; the action itself already succeeded. */
  readonly navigationFailed = signal(false);
  readonly busy = computed<boolean>(
    () => this.loading() || this.submitting() || this.navigationFailed(),
  );

  readonly copyState = signal<CopyState>('idle');
  private readonly lastAction = signal<PixAction | null>(null);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  /** This page only reads the active Order/Payment; it never creates them. */
  private readonly order = this.walletService.activeOrder;
  private readonly payment = this.walletService.activePayment;

  /** Decided once in ngOnInit: the Order/Payment leave PENDING after an action, the page must stay. */
  readonly ready = signal(false);

  readonly pixCode = computed<string>(() => {
    const payment = this.payment();
    const order = this.order();
    if (!payment || !order) {
      return '';
    }
    return buildPixCopyPasteCode(payment.gatewayPaymentId, order.amountCents);
  });

  readonly amountLabel = computed<string>(() => formatBrlFromCents(this.order()?.amountCents ?? 0));

  readonly copyButtonLabel = computed<string>(() =>
    this.copyState() === 'copied' ? 'Código copiado!' : 'Copiar código Pix',
  );

  readonly copyStatusMessage = computed<string>(() => {
    switch (this.copyState()) {
      case 'copied':
        return 'Código copiado!';
      case 'failed':
        return COPY_FAILED_MESSAGE;
      case 'idle':
        return '';
    }
  });

  readonly steps: readonly string[] = [
    'Abra o app do banco desejado e selecione a área Pix',
    'Escolha Pix Copia e Cola ou aponte a câmera para o QR Code acima',
    'Confirme o pagamento. Suas fichas ficarão disponíveis em sua carteira UTFgo',
  ];

  constructor() {
    this.destroyRef.onDestroy(() => this.clearCopyTimer());
  }

  ngOnInit(): void {
    this.walletService.clearError();
    // Without a PENDING Order and Payment (ex.: back after approving) there is nothing to pay here.
    this.ready.set(this.order()?.status === 'PENDING' && this.payment()?.status === 'PENDING');
    if (!this.ready()) {
      void this.router.navigate(['/cofrinho']);
    }
  }

  async copy(): Promise<void> {
    this.clearCopyTimer();
    try {
      await navigator.clipboard.writeText(this.pixCode());
      this.copyState.set('copied');
      this.copyTimer = setTimeout(() => {
        this.copyTimer = null;
        this.copyState.set('idle');
      }, COPIED_FEEDBACK_MS);
    } catch {
      this.copyState.set('failed');
    }
  }

  approve(): Promise<void> {
    return this.run('approve');
  }

  simulateFailure(): Promise<void> {
    return this.run('fail');
  }

  cancel(): Promise<void> {
    return this.run('cancel');
  }

  /** Repeats the action that failed. */
  retry(): Promise<void> {
    const action = this.lastAction();
    return action === null ? Promise.resolve() : this.run(action);
  }

  private async run(action: PixAction): Promise<void> {
    const order = this.order();
    const payment = this.payment();
    if (!order || !payment || this.busy()) {
      return;
    }
    if (action === 'approve' && this.isAccountBlocked()) {
      return;
    }

    this.lastAction.set(action);
    this.submitting.set(true);
    try {
      const succeeded = await this.execute(action, order.id, payment.id);
      if (succeeded) {
        await this.goToDestination(action);
      }
    } finally {
      this.submitting.set(false);
    }
  }

  /** The server action is already done: a failed navigation must not look like a service error. */
  private async goToDestination(action: PixAction): Promise<void> {
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

  private execute(action: PixAction, orderId: string, paymentId: string): Promise<boolean> {
    switch (action) {
      case 'approve':
        return this.walletService.confirmPayment(paymentId);
      case 'fail':
        return this.walletService.failPayment(paymentId);
      case 'cancel':
        return this.walletService.cancelOrder(orderId);
    }
  }

  private destination(action: PixAction): string {
    switch (action) {
      // TODO #2: /cofrinho/aprovado is created in task 9.
      case 'approve':
        return '/cofrinho/aprovado';
      // TODO #2: /cofrinho/falha is created in task 9.
      case 'fail':
        return '/cofrinho/falha';
      case 'cancel':
        return '/cofrinho';
    }
  }

  private clearCopyTimer(): void {
    if (this.copyTimer !== null) {
      clearTimeout(this.copyTimer);
      this.copyTimer = null;
    }
  }
}
