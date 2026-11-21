import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, forkJoin, map, switchMap } from 'rxjs';
import { WALLET_API_URL } from '../../../app.config';
import {
  MAX_TOKENS_PER_ORDER,
  MIN_TOKENS_PER_ORDER,
  Order,
  Payment,
  PaymentMethod,
  SIMULATED_USER_ID,
  StatementFilter,
  tokensToAmountCents,
  User,
  Wallet,
  WalletTransaction,
} from '../models/wallet.model';

type CreateOrderPayload = Omit<Order, 'id'>;
type CreatePaymentPayload = Omit<Payment, 'id'>;

function compareTimestampsDesc(firstIso: string, secondIso: string): number {
  const firstTime = Date.parse(firstIso);
  const secondTime = Date.parse(secondIso);

  if (Number.isNaN(firstTime) && Number.isNaN(secondTime)) {
    return 0;
  }
  if (Number.isNaN(firstTime)) {
    return 1;
  }
  if (Number.isNaN(secondTime)) {
    return -1;
  }

  return secondTime - firstTime;
}

function isValidTokensCount(tokensCount: number): boolean {
  return (
    Number.isInteger(tokensCount) &&
    tokensCount >= MIN_TOKENS_PER_ORDER &&
    tokensCount <= MAX_TOKENS_PER_ORDER
  );
}

/** Manages wallet balance, statement filtering and order/payment creation for the wallet feature. */
@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly http = inject(HttpClient);
  // TODO #2: Replace json-server base URL and SIMULATED_USER_ID with NestJS API + AuthService (Issue #1).
  private readonly apiUrl = inject(WALLET_API_URL).replace(/\/+$/, '');

  private paymentSequence = 0;

  private readonly _user = signal<User | null>(null);
  private readonly _wallet = signal<Wallet | null>(null);
  private readonly _orders = signal<Order[]>([]);
  private readonly _payments = signal<Payment[]>([]);
  private readonly _statementFilter = signal<StatementFilter>('ALL');
  private readonly _draftTokensCount = signal<number | null>(null);
  private readonly _activeOrderId = signal<string | null>(null);
  private readonly _activePaymentId = signal<string | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly wallet = this._wallet.asReadonly();
  readonly orders = this._orders.asReadonly();
  readonly payments = this._payments.asReadonly();
  readonly statementFilter = this._statementFilter.asReadonly();
  readonly draftTokensCount = this._draftTokensCount.asReadonly();
  readonly activeOrderId = this._activeOrderId.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isAccountBlocked = computed<boolean>(() => {
    const status = this._user()?.status;
    return status === 'SUSPENDED' || status === 'BANNED';
  });

  readonly accountBlockMessage = computed<string | null>(() => {
    const status = this._user()?.status;
    if (status === 'SUSPENDED') {
      return 'Sua conta está suspensa e não pode realizar compras de fichas.';
    }
    if (status === 'BANNED') {
      return 'Sua conta está banida e não pode realizar compras de fichas.';
    }
    return null;
  });

  readonly walletBalanceCents = computed<number>(() => {
    const currentWallet = this._wallet();
    return currentWallet ? tokensToAmountCents(currentWallet.tokenBalance) : 0;
  });

  readonly draftAmountCents = computed<number>(() => {
    const tokensCount = this._draftTokensCount();
    return tokensCount === null ? 0 : tokensToAmountCents(tokensCount);
  });

  readonly transactions = computed<WalletTransaction[]>(() => {
    const paymentsByOrder = new Map<string, Payment[]>();

    for (const payment of this._payments()) {
      const existing = paymentsByOrder.get(payment.orderId);
      if (existing) {
        existing.push(payment);
      } else {
        paymentsByOrder.set(payment.orderId, [payment]);
      }
    }

    const sortedOrders = [...this._orders()].sort((first, second) =>
      compareTimestampsDesc(first.createdAt, second.createdAt),
    );

    return sortedOrders.map((order) => {
      const orderPayments = [...(paymentsByOrder.get(order.id) ?? [])].sort((first, second) =>
        compareTimestampsDesc(first.createdAt, second.createdAt),
      );

      return {
        order,
        payments: orderPayments,
        latestPayment: orderPayments[0] ?? null,
      };
    });
  });

  readonly filteredTransactions = computed<WalletTransaction[]>(() => {
    const allTransactions = this.transactions();
    const filter = this._statementFilter();

    switch (filter) {
      case 'ALL':
        return allTransactions;
      case 'COMPLETED':
        return allTransactions.filter((tx) => tx.order.status === 'COMPLETED');
      case 'PENDING':
        return allTransactions.filter((tx) => tx.order.status === 'PENDING');
      case 'FAILED_OR_CANCELLED':
        return allTransactions.filter(
          (tx) =>
            tx.order.status === 'CANCELLED' ||
            (tx.order.status !== 'COMPLETED' && tx.latestPayment?.status === 'FAILED'),
        );
    }
  });

  readonly activeOrder = computed<Order | null>(() => {
    const activeId = this._activeOrderId();
    if (!activeId) {
      return null;
    }

    return this._orders().find((order) => order.id === activeId) ?? null;
  });

  readonly activePayment = computed<Payment | null>(() => {
    const activePaymentId = this._activePaymentId();
    const activeOrderId = this._activeOrderId();

    if (activePaymentId) {
      const matched = this._payments().find((payment) => payment.id === activePaymentId);
      if (matched && (!activeOrderId || matched.orderId === activeOrderId)) {
        return matched;
      }
    }

    if (!activeOrderId) {
      return null;
    }

    return this.transactions().find((tx) => tx.order.id === activeOrderId)?.latestPayment ?? null;
  });

  setStatementFilter(filter: StatementFilter): void {
    this._statementFilter.set(filter);
  }

  setDraftTokensCount(tokensCount: number | null): void {
    if (tokensCount === null || !isValidTokensCount(tokensCount)) {
      this._draftTokensCount.set(null);
      return;
    }

    this._draftTokensCount.set(tokensCount);
    // A new purchase must never reuse an Order from a previous one (retry is selectActiveOrder AFTER the draft).
    this._activeOrderId.set(null);
    this._activePaymentId.set(null);
  }

  selectActiveOrder(orderId: string | null): void {
    this._activeOrderId.set(orderId);
    this._activePaymentId.set(null);
  }

  clearError(): void {
    this._error.set(null);
  }

  /** Loads simulated user, wallet, orders and payments from json-server without mutating state on error. */
  async loadWalletData(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // TODO #2: Replace json-server REST calls with NestJS wallet endpoints once backend is ready.
      const userParams = new HttpParams().set('userId', SIMULATED_USER_ID);
      const [user, wallets, orders, payments] = await firstValueFrom(
        forkJoin([
          this.http.get<User>(`${this.apiUrl}/users/${SIMULATED_USER_ID}`),
          this.http.get<Wallet[]>(`${this.apiUrl}/wallets`, { params: userParams }),
          this.http.get<Order[]>(`${this.apiUrl}/orders`, { params: userParams }),
          this.http.get<Payment[]>(`${this.apiUrl}/payments`),
        ]),
      );

      const userOrderIds = new Set(orders.map((order) => order.id));
      const userPayments = payments.filter((payment) => userOrderIds.has(payment.orderId));
      const userWallet = wallets[0] ?? null;

      this._user.set(user);
      this._wallet.set(userWallet);
      this._orders.set(orders);
      this._payments.set(userPayments);

      if (!userWallet) {
        this._error.set('Carteira não encontrada para este usuário.');
      }
    } catch (err: unknown) {
      this._error.set(
        this.formatNetworkError(
          err,
          'Não foi possível carregar os dados da carteira. Tente novamente.',
        ),
      );
    } finally {
      this._loading.set(false);
    }
  }

  /** Creates a new PENDING Order and an initial PENDING Payment without altering Wallet.tokenBalance. */
  async createOrderAndPayment(
    tokensCount: number,
    method: PaymentMethod,
  ): Promise<WalletTransaction | null> {
    if (this._loading()) {
      return null;
    }

    const blockMessage = this.accountBlockMessage();
    if (blockMessage) {
      this._error.set(blockMessage);
      return null;
    }

    if (!isValidTokensCount(tokensCount)) {
      this._error.set(
        `Informe uma quantidade inteira entre ${MIN_TOKENS_PER_ORDER} e ${MAX_TOKENS_PER_ORDER} fichas.`,
      );
      return null;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const amountCents = tokensToAmountCents(tokensCount);
      const nowIso = new Date().toISOString();

      // TODO #2: Replace direct json-server Order/Payment persistence with POST /payments/orders.
      const orderPayload: CreateOrderPayload = {
        userId: SIMULATED_USER_ID,
        tokensCount,
        amountCents,
        status: 'PENDING',
        createdAt: nowIso,
      };

      const { order: createdOrder, payment: createdPayment } = await firstValueFrom(
        this.http.post<Order>(`${this.apiUrl}/orders`, orderPayload).pipe(
          switchMap((order) => {
            const paymentPayload = this.buildPendingPaymentPayload(order.id, method, amountCents);

            return this.http
              .post<Payment>(`${this.apiUrl}/payments`, paymentPayload)
              .pipe(map((payment) => ({ order, payment })));
          }),
        ),
      );

      this._orders.update((current) => [createdOrder, ...current]);
      this._payments.update((current) => [createdPayment, ...current]);
      this._activeOrderId.set(createdOrder.id);
      this._activePaymentId.set(createdPayment.id);

      return {
        order: createdOrder,
        payments: [createdPayment],
        latestPayment: createdPayment,
      };
    } catch (err: unknown) {
      this._error.set(
        this.formatNetworkError(
          err,
          'Não foi possível criar o pedido de pagamento. Tente novamente.',
        ),
      );
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /** Creates a new PENDING Payment attempt for an existing PENDING Order without duplicating the Order. */
  async createPaymentForOrder(orderId: string, method: PaymentMethod): Promise<Payment | null> {
    if (this._loading()) {
      return null;
    }

    const blockMessage = this.accountBlockMessage();
    if (blockMessage) {
      this._error.set(blockMessage);
      return null;
    }

    const existingOrder = this._orders().find((order) => order.id === orderId);
    if (!existingOrder) {
      this._error.set('Pedido não encontrado para nova tentativa de pagamento.');
      return null;
    }

    if (existingOrder.status !== 'PENDING') {
      this._error.set('Apenas pedidos pendentes podem receber uma nova tentativa de pagamento.');
      return null;
    }

    if (!isValidTokensCount(existingOrder.tokensCount)) {
      this._error.set('Quantidade de fichas do pedido é inválida.');
      return null;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const amountCents = tokensToAmountCents(existingOrder.tokensCount);
      // TODO #2: Replace direct json-server Payment creation with backend payment retry endpoint.
      const paymentPayload = this.buildPendingPaymentPayload(existingOrder.id, method, amountCents);

      const createdPayment = await firstValueFrom(
        this.http.post<Payment>(`${this.apiUrl}/payments`, paymentPayload),
      );

      this._payments.update((current) => [createdPayment, ...current]);
      this._activeOrderId.set(existingOrder.id);
      this._activePaymentId.set(createdPayment.id);

      return createdPayment;
    } catch (err: unknown) {
      this._error.set(
        this.formatNetworkError(
          err,
          'Não foi possível iniciar uma nova tentativa de pagamento. Tente novamente.',
        ),
      );
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Simulated gateway webhook approval: Payment -> PAID, Order -> COMPLETED, Wallet.tokenBalance += tokensCount.
   * Calls are sequential; on partial failure the already applied writes are compensated and success is never reported.
   * Never receives or sends card data (RNF06).
   */
  async confirmPayment(paymentId: string): Promise<boolean> {
    if (this._loading()) {
      return false;
    }

    const blockMessage = this.accountBlockMessage();
    if (blockMessage) {
      this._error.set(blockMessage);
      return false;
    }

    const payment = this._payments().find((item) => item.id === paymentId);
    const order = payment ? this._orders().find((item) => item.id === payment.orderId) : undefined;
    const wallet = this._wallet();

    if (!payment || !order) {
      this._error.set('Pagamento não encontrado para confirmação.');
      return false;
    }
    if (order.status !== 'PENDING') {
      this._error.set('Apenas pedidos pendentes aceitam confirmação de pagamento.');
      return false;
    }
    if (payment.status !== 'PENDING') {
      this._error.set('Apenas pagamentos pendentes podem ser confirmados.');
      return false;
    }
    if (!wallet) {
      this._error.set('Carteira não encontrada para este usuário.');
      return false;
    }

    this._loading.set(true);
    this._error.set(null);

    let paidPayment: Payment | null = null;
    let completedOrder: Order | null = null;

    try {
      // TODO #2: Replace these sequential json-server PATCH calls with POST /payments/webhook (HMAC SHA256).
      paidPayment = await firstValueFrom(
        this.http.patch<Payment>(`${this.apiUrl}/payments/${payment.id}`, {
          status: 'PAID',
          paidAt: new Date().toISOString(),
        }),
      );
      completedOrder = await firstValueFrom(
        this.http.patch<Order>(`${this.apiUrl}/orders/${order.id}`, { status: 'COMPLETED' }),
      );
      const updatedWallet = await firstValueFrom(
        this.http.patch<Wallet>(`${this.apiUrl}/wallets/${wallet.id}`, {
          tokenBalance: wallet.tokenBalance + order.tokensCount,
          updatedAt: new Date().toISOString(),
        }),
      );

      this._payments.update((current) =>
        current.map((item) => (item.id === payment.id ? (paidPayment ?? item) : item)),
      );
      this._orders.update((current) =>
        current.map((item) => (item.id === order.id ? (completedOrder ?? item) : item)),
      );
      this._wallet.set(updatedWallet);
      this._activeOrderId.set(order.id);
      this._activePaymentId.set(payment.id);

      return true;
    } catch (err: unknown) {
      const compensated = await this.compensatePartialConfirmation(
        payment.id,
        order.id,
        paidPayment !== null,
        completedOrder !== null,
      );
      const baseMessage = this.formatNetworkError(
        err,
        'Não foi possível confirmar o pagamento. Tente novamente.',
      );
      this._error.set(
        compensated
          ? baseMessage
          : `${baseMessage} Não foi possível desfazer as alterações parciais; recarregue a carteira antes de tentar novamente.`,
      );
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  /** Simulated failure/expiration: Payment -> FAILED, Order stays PENDING, Wallet.tokenBalance untouched. */
  async failPayment(paymentId: string): Promise<boolean> {
    if (this._loading()) {
      return false;
    }

    const payment = this._payments().find((item) => item.id === paymentId);
    const order = payment ? this._orders().find((item) => item.id === payment.orderId) : undefined;

    if (!payment || !order) {
      this._error.set('Pagamento não encontrado.');
      return false;
    }
    if (order.status !== 'PENDING') {
      this._error.set('Apenas pedidos pendentes podem ter o pagamento marcado como falho.');
      return false;
    }
    if (payment.status !== 'PENDING') {
      this._error.set('Apenas pagamentos pendentes podem falhar.');
      return false;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      // TODO #2: Replace simulated failure/expiration with the gateway webhook event.
      const failedPayment = await firstValueFrom(
        this.http.patch<Payment>(`${this.apiUrl}/payments/${payment.id}`, { status: 'FAILED' }),
      );

      this._payments.update((current) =>
        current.map((item) => (item.id === payment.id ? failedPayment : item)),
      );
      this._activeOrderId.set(order.id);
      this._activePaymentId.set(payment.id);

      return true;
    } catch (err: unknown) {
      this._error.set(
        this.formatNetworkError(err, 'Não foi possível registrar a falha do pagamento. Tente novamente.'),
      );
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  /** Cancels a PENDING Order; a CANCELLED Order no longer accepts payment confirmation. */
  async cancelOrder(orderId: string): Promise<boolean> {
    if (this._loading()) {
      return false;
    }

    const order = this._orders().find((item) => item.id === orderId);
    if (!order) {
      this._error.set('Pedido não encontrado.');
      return false;
    }
    if (order.status !== 'PENDING') {
      this._error.set('Apenas pedidos pendentes podem ser cancelados.');
      return false;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const cancelledOrder = await firstValueFrom(
        this.http.patch<Order>(`${this.apiUrl}/orders/${order.id}`, { status: 'CANCELLED' }),
      );

      this._orders.update((current) =>
        current.map((item) => (item.id === order.id ? cancelledOrder : item)),
      );

      return true;
    } catch (err: unknown) {
      this._error.set(
        this.formatNetworkError(err, 'Não foi possível cancelar o pedido. Tente novamente.'),
      );
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  /** Reverts already applied writes (Order first, then Payment). Returns false if any revert fails. */
  private async compensatePartialConfirmation(
    paymentId: string,
    orderId: string,
    paymentWasPaid: boolean,
    orderWasCompleted: boolean,
  ): Promise<boolean> {
    let compensated = true;

    if (orderWasCompleted) {
      try {
        await firstValueFrom(
          this.http.patch<Order>(`${this.apiUrl}/orders/${orderId}`, { status: 'PENDING' }),
        );
      } catch {
        compensated = false;
      }
    }

    if (paymentWasPaid) {
      try {
        await firstValueFrom(
          this.http.patch<Payment>(`${this.apiUrl}/payments/${paymentId}`, {
            status: 'PENDING',
            paidAt: null,
          }),
        );
      } catch {
        compensated = false;
      }
    }

    return compensated;
  }

  private buildPendingPaymentPayload(
    orderId: string,
    method: PaymentMethod,
    amountCents: number,
  ): CreatePaymentPayload {
    return {
      orderId,
      gatewayPaymentId: this.generateGatewayPaymentId(method),
      method,
      amountCents,
      status: 'PENDING',
      paidAt: null,
      createdAt: new Date().toISOString(),
    };
  }

  // TODO #2: Replace simulated gatewayPaymentId with Mercado Pago Sandbox payment ID from backend.
  private generateGatewayPaymentId(method: PaymentMethod): string {
    this.paymentSequence += 1;
    const methodSlug = method === 'PIX' ? 'pix' : 'card';
    const randomSuffix =
      typeof globalThis.crypto?.randomUUID === 'function'
        ? globalThis.crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10);

    return `mp-${methodSlug}-${Date.now()}-${this.paymentSequence}-${randomSuffix}`;
  }

  private formatNetworkError(err: unknown, fallbackMessage: string): string {
    if (err instanceof HttpErrorResponse && err.status === 0) {
      return 'Não foi possível conectar ao servidor da carteira. Verifique sua conexão e tente novamente.';
    }

    return fallbackMessage;
  }
}
