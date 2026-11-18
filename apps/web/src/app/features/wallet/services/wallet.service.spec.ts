import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { WALLET_API_URL } from '../../../app.config';
import { Order, Payment, SIMULATED_USER_ID, User, Wallet } from '../models/wallet.model';
import { WalletService } from './wallet.service';

describe('WalletService (part 1)', () => {
  const mockApiUrl = 'http://api.utfgo.test';

  let service: WalletService;
  let httpMock: HttpTestingController;

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

  function flushLoadWalletData(
    user: User = activeUser,
    wallets: Wallet[] = [baseWallet],
    orders: Order[] = [],
    payments: Payment[] = [],
  ): void {
    httpMock.expectOne(`${mockApiUrl}/users/${SIMULATED_USER_ID}`).flush(user);
    httpMock.expectOne(`${mockApiUrl}/wallets?userId=${SIMULATED_USER_ID}`).flush(wallets);
    httpMock.expectOne(`${mockApiUrl}/orders?userId=${SIMULATED_USER_ID}`).flush(orders);
    httpMock.expectOne(`${mockApiUrl}/payments`).flush(payments);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WALLET_API_URL, useValue: mockApiUrl },
      ],
    });

    service = TestBed.inject(WalletService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('starts with empty/default readonly signals', () => {
    expect(service.user()).toBeNull();
    expect(service.wallet()).toBeNull();
    expect(service.orders()).toEqual([]);
    expect(service.payments()).toEqual([]);
    expect(service.transactions()).toEqual([]);
    expect(service.filteredTransactions()).toEqual([]);
    expect(service.statementFilter()).toBe('ALL');
    expect(service.isAccountBlocked()).toBe(false);
    expect(service.draftTokensCount()).toBeNull();
    expect(service.activeOrderId()).toBeNull();
    expect(service.activeOrder()).toBeNull();
    expect(service.activePayment()).toBeNull();
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  describe('loadWalletData and statement assembly (CA1)', () => {
    it('loads user-1, wallet, orders and payments sorted newest first and ignores other users payments', async () => {
      const orders: Order[] = [
        {
          id: 'order-old',
          userId: SIMULATED_USER_ID,
          tokensCount: 5,
          amountCents: 1000,
          status: 'COMPLETED',
          createdAt: '2026-10-01T10:00:00.000Z',
        },
        {
          id: 'order-newest',
          userId: SIMULATED_USER_ID,
          tokensCount: 10,
          amountCents: 2000,
          status: 'PENDING',
          createdAt: '2026-10-12T15:30:00.000Z',
        },
        {
          id: 'order-mid',
          userId: SIMULATED_USER_ID,
          tokensCount: 1,
          amountCents: 200,
          status: 'CANCELLED',
          createdAt: '2026-10-05T12:00:00.000Z',
        },
      ];

      const payments: Payment[] = [
        {
          id: 'pay-old',
          orderId: 'order-old',
          gatewayPaymentId: 'mp-pix-001',
          method: 'PIX',
          amountCents: 1000,
          status: 'PAID',
          paidAt: '2026-10-01T10:01:00.000Z',
          createdAt: '2026-10-01T10:00:10.000Z',
        },
        {
          id: 'pay-newest-1',
          orderId: 'order-newest',
          gatewayPaymentId: 'mp-pix-002',
          method: 'PIX',
          amountCents: 2000,
          status: 'FAILED',
          paidAt: null,
          createdAt: '2026-10-12T15:31:00.000Z',
        },
        {
          id: 'pay-newest-2',
          orderId: 'order-newest',
          gatewayPaymentId: 'mp-card-003',
          method: 'CREDIT_CARD',
          amountCents: 2000,
          status: 'PENDING',
          paidAt: null,
          createdAt: '2026-10-12T15:35:00.000Z',
        },
        {
          id: 'pay-other-user',
          orderId: 'order-other-user',
          gatewayPaymentId: 'mp-pix-999',
          method: 'PIX',
          amountCents: 4000,
          status: 'PAID',
          paidAt: '2026-10-12T16:00:00.000Z',
          createdAt: '2026-10-12T15:59:00.000Z',
        },
      ];

      const loadPromise = service.loadWalletData();
      expect(service.loading()).toBe(true);

      flushLoadWalletData(activeUser, [baseWallet], orders, payments);
      await loadPromise;

      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.user()).toEqual(activeUser);
      expect(service.wallet()).toEqual(baseWallet);
      expect(service.walletBalanceCents()).toBe(2000);
      expect(service.isAccountBlocked()).toBe(false);
      expect(service.payments().some((payment) => payment.id === 'pay-other-user')).toBe(false);

      const transactions = service.transactions();
      expect(transactions.map((tx) => tx.order.id)).toEqual([
        'order-newest',
        'order-mid',
        'order-old',
      ]);

      expect(transactions[0].payments.map((payment) => payment.id)).toEqual([
        'pay-newest-2',
        'pay-newest-1',
      ]);
      expect(transactions[0].latestPayment?.id).toBe('pay-newest-2');
      expect(transactions[1].payments).toEqual([]);
      expect(transactions[1].latestPayment).toBeNull();
      expect(transactions[2].latestPayment?.id).toBe('pay-old');
    });

    it('handles empty orders and payments gracefully (CA1 empty state)', async () => {
      const loadPromise = service.loadWalletData();
      flushLoadWalletData(activeUser, [baseWallet], [], []);
      await loadPromise;

      expect(service.error()).toBeNull();
      expect(service.wallet()?.tokenBalance).toBe(10);
      expect(service.transactions()).toEqual([]);
      expect(service.filteredTransactions()).toEqual([]);
    });

    it('sets clear error when wallet is missing from response', async () => {
      const loadPromise = service.loadWalletData();
      flushLoadWalletData(activeUser, [], [], []);
      await loadPromise;

      expect(service.wallet()).toBeNull();
      expect(service.error()).toBeTruthy();
    });
  });

  describe('in-memory statement filtering (CA2)', () => {
    it('filters transactions by ALL, COMPLETED, PENDING, and FAILED_OR_CANCELLED without extra HTTP requests', async () => {
      const orders: Order[] = [
        {
          id: 'order-completed',
          userId: SIMULATED_USER_ID,
          tokensCount: 10,
          amountCents: 2000,
          status: 'COMPLETED',
          createdAt: '2026-10-10T14:00:00.000Z',
        },
        {
          id: 'order-pending',
          userId: SIMULATED_USER_ID,
          tokensCount: 5,
          amountCents: 1000,
          status: 'PENDING',
          createdAt: '2026-10-11T14:00:00.000Z',
        },
        {
          id: 'order-pending-failed',
          userId: SIMULATED_USER_ID,
          tokensCount: 20,
          amountCents: 4000,
          status: 'PENDING',
          createdAt: '2026-10-12T14:00:00.000Z',
        },
        {
          id: 'order-cancelled',
          userId: SIMULATED_USER_ID,
          tokensCount: 1,
          amountCents: 200,
          status: 'CANCELLED',
          createdAt: '2026-10-13T14:00:00.000Z',
        },
      ];

      const payments: Payment[] = [
        {
          id: 'pay-completed',
          orderId: 'order-completed',
          gatewayPaymentId: 'mp-1',
          method: 'PIX',
          amountCents: 2000,
          status: 'PAID',
          paidAt: '2026-10-10T14:05:00.000Z',
          createdAt: '2026-10-10T14:00:10.000Z',
        },
        {
          id: 'pay-pending',
          orderId: 'order-pending',
          gatewayPaymentId: 'mp-2',
          method: 'PIX',
          amountCents: 1000,
          status: 'PENDING',
          paidAt: null,
          createdAt: '2026-10-11T14:00:10.000Z',
        },
        {
          id: 'pay-failed',
          orderId: 'order-pending-failed',
          gatewayPaymentId: 'mp-3',
          method: 'CREDIT_CARD',
          amountCents: 4000,
          status: 'FAILED',
          paidAt: null,
          createdAt: '2026-10-12T14:00:10.000Z',
        },
      ];

      const loadPromise = service.loadWalletData();
      flushLoadWalletData(activeUser, [baseWallet], orders, payments);
      await loadPromise;

      expect(service.filteredTransactions().map((tx) => tx.order.id)).toEqual([
        'order-cancelled',
        'order-pending-failed',
        'order-pending',
        'order-completed',
      ]);

      service.setStatementFilter('COMPLETED');
      expect(service.statementFilter()).toBe('COMPLETED');
      expect(service.filteredTransactions().map((tx) => tx.order.id)).toEqual(['order-completed']);
      expect(service.wallet()?.tokenBalance).toBe(10);

      service.setStatementFilter('PENDING');
      expect(service.filteredTransactions().map((tx) => tx.order.id)).toEqual([
        'order-pending-failed',
        'order-pending',
      ]);

      service.setStatementFilter('FAILED_OR_CANCELLED');
      expect(service.filteredTransactions().map((tx) => tx.order.id)).toEqual([
        'order-cancelled',
        'order-pending-failed',
      ]);

      service.setStatementFilter('ALL');
      expect(service.filteredTransactions()).toHaveLength(4);
      expect(service.wallet()?.tokenBalance).toBe(10);
    });
  });

  describe('account restriction for SUSPENDED and BANNED users (CA13)', () => {
    it('blocks purchase creation and retry when User.status is SUSPENDED', async () => {
      const suspendedUser: User = { ...activeUser, status: 'SUSPENDED' };
      const pendingOrder: Order = {
        id: 'order-pending',
        userId: SIMULATED_USER_ID,
        tokensCount: 5,
        amountCents: 1000,
        status: 'PENDING',
        createdAt: '2026-10-11T10:00:00.000Z',
      };

      const loadPromise = service.loadWalletData();
      flushLoadWalletData(suspendedUser, [baseWallet], [pendingOrder], []);
      await loadPromise;

      expect(service.isAccountBlocked()).toBe(true);
      expect(service.accountBlockMessage()?.toLowerCase()).toContain('suspensa');

      const created = await service.createOrderAndPayment(5, 'PIX');
      expect(created).toBeNull();
      expect(service.error()?.toLowerCase()).toContain('suspensa');

      const retried = await service.createPaymentForOrder('order-pending', 'CREDIT_CARD');
      expect(retried).toBeNull();
      expect(service.error()?.toLowerCase()).toContain('suspensa');
    });

    it('blocks purchase creation when User.status is BANNED', async () => {
      const bannedUser: User = { ...activeUser, status: 'BANNED' };

      const loadPromise = service.loadWalletData();
      flushLoadWalletData(bannedUser, [baseWallet], [], []);
      await loadPromise;

      expect(service.isAccountBlocked()).toBe(true);
      expect(service.accountBlockMessage()?.toLowerCase()).toContain('banida');

      const created = await service.createOrderAndPayment(10, 'PIX');
      expect(created).toBeNull();
      expect(service.error()?.toLowerCase()).toContain('banida');
    });
  });

  describe('creating Order and Payment without premature balance credit (CA6)', () => {
    it('tracks draftTokensCount and computes draftAmountCents', () => {
      service.setDraftTokensCount(8);
      expect(service.draftTokensCount()).toBe(8);
      expect(service.draftAmountCents()).toBe(1600);

      service.setDraftTokensCount(null);
      expect(service.draftTokensCount()).toBeNull();
      expect(service.draftAmountCents()).toBe(0);

      service.setDraftTokensCount(0);
      expect(service.draftTokensCount()).toBeNull();
    });

    it('creates PENDING Order and Payment with unique gatewayPaymentId without changing Wallet.tokenBalance', async () => {
      const loadPromise = service.loadWalletData();
      flushLoadWalletData(activeUser, [baseWallet], [], []);
      await loadPromise;

      const createPromise1 = service.createOrderAndPayment(5, 'PIX');
      expect(service.loading()).toBe(true);

      const orderReq1 = httpMock.expectOne({
        method: 'POST',
        url: `${mockApiUrl}/orders`,
      });
      expect(orderReq1.request.body).toEqual({
        userId: SIMULATED_USER_ID,
        tokensCount: 5,
        amountCents: 1000,
        status: 'PENDING',
        createdAt: expect.any(String),
      });

      const createdOrder1: Order = {
        id: 'order-101',
        userId: SIMULATED_USER_ID,
        tokensCount: 5,
        amountCents: 1000,
        status: 'PENDING',
        createdAt: '2026-11-18T12:00:00.000Z',
      };
      orderReq1.flush(createdOrder1);

      const paymentReq1 = httpMock.expectOne({
        method: 'POST',
        url: `${mockApiUrl}/payments`,
      });
      expect(paymentReq1.request.body).toEqual({
        orderId: 'order-101',
        gatewayPaymentId: expect.any(String),
        method: 'PIX',
        amountCents: 1000,
        status: 'PENDING',
        paidAt: null,
        createdAt: expect.any(String),
      });
      const gatewayId1 = paymentReq1.request.body.gatewayPaymentId as string;
      expect(gatewayId1.length).toBeGreaterThan(0);

      const createdPayment1: Payment = {
        id: 'pay-101',
        orderId: 'order-101',
        gatewayPaymentId: gatewayId1,
        method: 'PIX',
        amountCents: 1000,
        status: 'PENDING',
        paidAt: null,
        createdAt: '2026-11-18T12:00:01.000Z',
      };
      paymentReq1.flush(createdPayment1);

      const tx1 = await createPromise1;

      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(tx1?.order).toEqual(createdOrder1);
      expect(tx1?.latestPayment).toEqual(createdPayment1);
      expect(service.activeOrderId()).toBe('order-101');
      expect(service.activeOrder()).toEqual(createdOrder1);
      expect(service.activePayment()).toEqual(createdPayment1);
      expect(service.wallet()?.tokenBalance).toBe(10);

      // Second order produces a distinct gatewayPaymentId and never credits wallet prematurely
      const createPromise2 = service.createOrderAndPayment(8, 'CREDIT_CARD');
      const orderReq2 = httpMock.expectOne({
        method: 'POST',
        url: `${mockApiUrl}/orders`,
      });
      const createdOrder2: Order = {
        id: 'order-102',
        userId: SIMULATED_USER_ID,
        tokensCount: 8,
        amountCents: 1600,
        status: 'PENDING',
        createdAt: '2026-11-18T12:01:00.000Z',
      };
      orderReq2.flush(createdOrder2);

      const paymentReq2 = httpMock.expectOne({
        method: 'POST',
        url: `${mockApiUrl}/payments`,
      });
      const gatewayId2 = paymentReq2.request.body.gatewayPaymentId as string;
      expect(gatewayId2).not.toBe(gatewayId1);
      expect(paymentReq2.request.body.amountCents).toBe(1600);
      expect(paymentReq2.request.body.method).toBe('CREDIT_CARD');

      paymentReq2.flush({
        id: 'pay-102',
        orderId: 'order-102',
        gatewayPaymentId: gatewayId2,
        method: 'CREDIT_CARD',
        amountCents: 1600,
        status: 'PENDING',
        paidAt: null,
        createdAt: '2026-11-18T12:01:01.000Z',
      } satisfies Payment);

      await createPromise2;
      expect(service.wallet()?.tokenBalance).toBe(10);
      expect(service.orders()).toHaveLength(2);
    });

    it('rejects out-of-range or non-integer token quantities without calling HTTP', async () => {
      for (const invalidCount of [0, -2, 1.5, 101, Number.NaN]) {
        const result = await service.createOrderAndPayment(invalidCount, 'PIX');
        expect(result).toBeNull();
        expect(service.error()).toBeTruthy();
      }
    });
  });

  describe('retrying payment on existing PENDING Order (CA10)', () => {
    it('creates a new Payment for an existing PENDING orderId without duplicating Order', async () => {
      const pendingOrder: Order = {
        id: 'order-pending-1',
        userId: SIMULATED_USER_ID,
        tokensCount: 10,
        amountCents: 2000,
        status: 'PENDING',
        createdAt: '2026-11-18T11:00:00.000Z',
      };
      const failedPayment: Payment = {
        id: 'pay-failed-1',
        orderId: 'order-pending-1',
        gatewayPaymentId: 'mp-pix-failed-1',
        method: 'PIX',
        amountCents: 2000,
        status: 'FAILED',
        paidAt: null,
        createdAt: '2026-11-18T11:00:10.000Z',
      };

      const loadPromise = service.loadWalletData();
      flushLoadWalletData(activeUser, [baseWallet], [pendingOrder], [failedPayment]);
      await loadPromise;

      service.selectActiveOrder('order-pending-1');
      expect(service.activeOrder()?.id).toBe('order-pending-1');
      expect(service.activePayment()?.id).toBe('pay-failed-1');

      const retryPromise = service.createPaymentForOrder('order-pending-1', 'CREDIT_CARD');
      expect(service.loading()).toBe(true);

      httpMock.expectNone({ method: 'POST', url: `${mockApiUrl}/orders` });
      const paymentReq = httpMock.expectOne({
        method: 'POST',
        url: `${mockApiUrl}/payments`,
      });
      expect(paymentReq.request.body).toEqual({
        orderId: 'order-pending-1',
        gatewayPaymentId: expect.any(String),
        method: 'CREDIT_CARD',
        amountCents: 2000,
        status: 'PENDING',
        paidAt: null,
        createdAt: expect.any(String),
      });
      expect(paymentReq.request.body.gatewayPaymentId).not.toBe('mp-pix-failed-1');

      const retryPayment: Payment = {
        id: 'pay-retry-2',
        orderId: 'order-pending-1',
        gatewayPaymentId: paymentReq.request.body.gatewayPaymentId as string,
        method: 'CREDIT_CARD',
        amountCents: 2000,
        status: 'PENDING',
        paidAt: null,
        createdAt: '2026-11-18T11:05:00.000Z',
      };
      paymentReq.flush(retryPayment);

      const createdPayment = await retryPromise;

      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(createdPayment).toEqual(retryPayment);
      expect(service.orders()).toHaveLength(1);
      expect(service.payments()).toHaveLength(2);
      expect(service.activeOrder()?.id).toBe('order-pending-1');
      expect(service.activePayment()?.id).toBe('pay-retry-2');
      expect(service.transactions()[0].latestPayment?.id).toBe('pay-retry-2');
      expect(service.wallet()?.tokenBalance).toBe(10);

      service.selectActiveOrder(null);
      expect(service.activeOrderId()).toBeNull();
      expect(service.activeOrder()).toBeNull();
      expect(service.activePayment()).toBeNull();
    });

    it('rejects new payment attempt when order is COMPLETED or CANCELLED', async () => {
      const orders: Order[] = [
        {
          id: 'order-completed',
          userId: SIMULATED_USER_ID,
          tokensCount: 5,
          amountCents: 1000,
          status: 'COMPLETED',
          createdAt: '2026-11-18T10:00:00.000Z',
        },
        {
          id: 'order-cancelled',
          userId: SIMULATED_USER_ID,
          tokensCount: 5,
          amountCents: 1000,
          status: 'CANCELLED',
          createdAt: '2026-11-18T10:05:00.000Z',
        },
      ];

      const loadPromise = service.loadWalletData();
      flushLoadWalletData(activeUser, [baseWallet], orders, []);
      await loadPromise;

      expect(await service.createPaymentForOrder('order-completed', 'PIX')).toBeNull();
      expect(service.error()).toBeTruthy();

      service.clearError();
      expect(await service.createPaymentForOrder('order-cancelled', 'PIX')).toBeNull();
      expect(service.error()).toBeTruthy();
    });
  });

  describe('network and HTTP failure handling preserving state (CA14)', () => {
    it('sets friendly error and preserves draftTokensCount when initial load fails', async () => {
      service.setDraftTokensCount(10);

      const loadPromise = service.loadWalletData();
      httpMock
        .expectOne(`${mockApiUrl}/users/${SIMULATED_USER_ID}`)
        .error(new ProgressEvent('error'));
      httpMock.expectOne(`${mockApiUrl}/wallets?userId=${SIMULATED_USER_ID}`);
      httpMock.expectOne(`${mockApiUrl}/orders?userId=${SIMULATED_USER_ID}`);
      httpMock.expectOne(`${mockApiUrl}/payments`);

      await loadPromise;

      expect(service.loading()).toBe(false);
      expect(service.error()).toBeTruthy();
      expect(service.draftTokensCount()).toBe(10);
      expect(service.wallet()).toBeNull();
    });

    it('preserves wallet, draftTokensCount and activeOrderId when createOrderAndPayment fails', async () => {
      const existingOrder: Order = {
        id: 'order-existing',
        userId: SIMULATED_USER_ID,
        tokensCount: 5,
        amountCents: 1000,
        status: 'PENDING',
        createdAt: '2026-11-18T09:00:00.000Z',
      };

      const loadPromise = service.loadWalletData();
      flushLoadWalletData(activeUser, [baseWallet], [existingOrder], []);
      await loadPromise;

      service.setDraftTokensCount(20);
      service.selectActiveOrder('order-existing');

      const createPromise = service.createOrderAndPayment(20, 'PIX');
      httpMock
        .expectOne({ method: 'POST', url: `${mockApiUrl}/orders` })
        .flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      const result = await createPromise;

      expect(result).toBeNull();
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeTruthy();
      expect(service.draftTokensCount()).toBe(20);
      expect(service.activeOrderId()).toBe('order-existing');
      expect(service.wallet()).toEqual(baseWallet);
      expect(service.orders()).toEqual([existingOrder]);
    });

    it('preserves selected state when createPaymentForOrder fails due to network outage', async () => {
      const pendingOrder: Order = {
        id: 'order-pending-1',
        userId: SIMULATED_USER_ID,
        tokensCount: 10,
        amountCents: 2000,
        status: 'PENDING',
        createdAt: '2026-11-18T11:00:00.000Z',
      };

      const loadPromise = service.loadWalletData();
      flushLoadWalletData(activeUser, [baseWallet], [pendingOrder], []);
      await loadPromise;

      service.setDraftTokensCount(10);
      service.selectActiveOrder('order-pending-1');

      const retryPromise = service.createPaymentForOrder('order-pending-1', 'PIX');
      httpMock
        .expectOne({ method: 'POST', url: `${mockApiUrl}/payments` })
        .error(new ProgressEvent('error'));

      const result = await retryPromise;

      expect(result).toBeNull();
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeTruthy();
      expect(service.draftTokensCount()).toBe(10);
      expect(service.activeOrderId()).toBe('order-pending-1');
      expect(service.wallet()).toEqual(baseWallet);
      expect(service.payments()).toEqual([]);
    });

    it('preserves previously loaded state when a subsequent loadWalletData fails', async () => {
      const existingOrder: Order = {
        id: 'order-existing',
        userId: SIMULATED_USER_ID,
        tokensCount: 5,
        amountCents: 1000,
        status: 'PENDING',
        createdAt: '2026-11-18T09:00:00.000Z',
      };

      const firstLoad = service.loadWalletData();
      flushLoadWalletData(activeUser, [baseWallet], [existingOrder], []);
      await firstLoad;

      service.setDraftTokensCount(8);
      service.selectActiveOrder('order-existing');

      const reloadPromise = service.loadWalletData();
      httpMock.expectOne(`${mockApiUrl}/users/${SIMULATED_USER_ID}`).flush(activeUser);
      httpMock
        .expectOne(`${mockApiUrl}/wallets?userId=${SIMULATED_USER_ID}`)
        .flush({ message: 'Unavailable' }, { status: 503, statusText: 'Service Unavailable' });
      httpMock.expectOne(`${mockApiUrl}/orders?userId=${SIMULATED_USER_ID}`);
      httpMock.expectOne(`${mockApiUrl}/payments`);

      await reloadPromise;

      expect(service.loading()).toBe(false);
      expect(service.error()).toBeTruthy();
      expect(service.user()).toEqual(activeUser);
      expect(service.wallet()).toEqual(baseWallet);
      expect(service.orders()).toEqual([existingOrder]);
      expect(service.draftTokensCount()).toBe(8);
      expect(service.activeOrderId()).toBe('order-existing');
    });

    it('preserves selected state if POST /payments fails after POST /orders succeeds', async () => {
      const loadPromise = service.loadWalletData();
      flushLoadWalletData(activeUser, [baseWallet], [], []);
      await loadPromise;

      service.setDraftTokensCount(5);

      const createPromise = service.createOrderAndPayment(5, 'PIX');
      httpMock.expectOne({ method: 'POST', url: `${mockApiUrl}/orders` }).flush({
        id: 'order-temp',
        userId: SIMULATED_USER_ID,
        tokensCount: 5,
        amountCents: 1000,
        status: 'PENDING',
        createdAt: '2026-11-18T12:00:00.000Z',
      } satisfies Order);

      httpMock
        .expectOne({ method: 'POST', url: `${mockApiUrl}/payments` })
        .error(new ProgressEvent('error'));

      const result = await createPromise;

      expect(result).toBeNull();
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeTruthy();
      expect(service.draftTokensCount()).toBe(5);
      expect(service.activeOrderId()).toBeNull();
      expect(service.wallet()).toEqual(baseWallet);
      expect(service.orders()).toEqual([]);
      expect(service.payments()).toEqual([]);
    });
  });
});
