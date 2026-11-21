import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { appConfig, WALLET_API_URL } from '../../../app.config';
import { environment } from '../../../../environments/environment';
import seedDb from '../../../../../../api/db.json';
import {
  formatBrlFromCents,
  MAX_TOKENS_PER_ORDER,
  MIN_TOKENS_PER_ORDER,
  Order,
  Payment,
  SIMULATED_USER_ID,
  TOKEN_PACKAGES,
  TOKEN_UNIT_PRICE_CENTS,
  tokensToAmountCents,
  User,
  Wallet,
  WalletDatabase,
} from './wallet.model';

describe('wallet.model', () => {
  describe('business constants (RN05/06)', () => {
    it('defines fixed token unit price, quick packages, limits and simulated user', () => {
      expect(TOKEN_UNIT_PRICE_CENTS).toBe(200);
      expect(TOKEN_PACKAGES).toEqual([1, 5, 10, 20]);
      expect(MIN_TOKENS_PER_ORDER).toBe(1);
      expect(MAX_TOKENS_PER_ORDER).toBe(100);
      expect(SIMULATED_USER_ID).toBe('user-1');
    });
  });

  describe('tokensToAmountCents', () => {
    it('calculates exact amount in cents for valid token quantities (CA3, CA4)', () => {
      expect(tokensToAmountCents(0)).toBe(0);
      expect(tokensToAmountCents(1)).toBe(200);
      expect(tokensToAmountCents(5)).toBe(1000);
      expect(tokensToAmountCents(8)).toBe(1600);
      expect(tokensToAmountCents(10)).toBe(2000);
      expect(tokensToAmountCents(20)).toBe(4000);
      expect(tokensToAmountCents(100)).toBe(20000);
    });

    it('rejects negative, fractional or non-finite token counts', () => {
      expect(() => tokensToAmountCents(-1)).toThrow(RangeError);
      expect(() => tokensToAmountCents(1.5)).toThrow(RangeError);
      expect(() => tokensToAmountCents(Number.NaN)).toThrow(RangeError);
    });
  });

  describe('formatBrlFromCents', () => {
    it('formats integer cents into Brazilian Real string with standard space (CA1, CA3, CA4)', () => {
      expect(formatBrlFromCents(0)).toBe('R$ 0,00');
      expect(formatBrlFromCents(200)).toBe('R$ 2,00');
      expect(formatBrlFromCents(1600)).toBe('R$ 16,00');
      expect(formatBrlFromCents(20000)).toBe('R$ 200,00');
      expect(formatBrlFromCents(100000)).toBe('R$ 1.000,00');
    });

    it('rejects non-integer or non-finite cent values', () => {
      expect(() => formatBrlFromCents(12.5)).toThrow(RangeError);
      expect(() => formatBrlFromCents(Number.NaN)).toThrow(RangeError);
    });
  });

  describe('initial db.json seed (Assume que 1-2)', () => {
    const db: WalletDatabase = seedDb as WalletDatabase;

    it('contains users, wallets, orders and payments collections with string IDs', () => {
      expect(Array.isArray(db.users)).toBe(true);
      expect(Array.isArray(db.wallets)).toBe(true);
      expect(Array.isArray(db.orders)).toBe(true);
      expect(Array.isArray(db.payments)).toBe(true);
    });

    it('seeds user-1 as ACTIVE PASSENGER named Caio and wallet-1 linked to user-1', () => {
      const user: User | undefined = db.users.find((item) => item.id === 'user-1');
      const wallet: Wallet | undefined = db.wallets.find((item) => item.id === 'wallet-1');

      expect(user).toBeDefined();
      expect(user).toEqual({
        id: 'user-1',
        email: expect.any(String),
        name: 'Caio',
        role: 'PASSENGER',
        status: 'ACTIVE',
        createdAt: expect.any(String),
      });
      expect(Number.isNaN(Date.parse(user!.createdAt))).toBe(false);

      expect(wallet).toBeDefined();
      expect(wallet).toEqual({
        id: 'wallet-1',
        userId: 'user-1',
        tokenBalance: expect.any(Number),
        penaltyPoints: 0,
        updatedAt: expect.any(String),
      });
      expect(Number.isInteger(wallet!.tokenBalance)).toBe(true);
      expect(wallet!.tokenBalance).toBeGreaterThanOrEqual(0);
      expect(Number.isNaN(Date.parse(wallet!.updatedAt))).toBe(false);
    });

    it('seeds consistent orders and payments without sensitive card fields', () => {
      const orderIds = new Set(db.orders.map((order: Order) => order.id));
      const gatewayIds = new Set(db.payments.map((payment: Payment) => payment.gatewayPaymentId));

      expect(orderIds.has('order-1')).toBe(true);
      expect(db.payments.some((payment: Payment) => payment.id === 'pay-1')).toBe(true);
      expect(gatewayIds.size).toBe(db.payments.length);

      for (const order of db.orders) {
        expect(typeof order.id).toBe('string');
        expect(order.userId).toBe('user-1');
        expect(Number.isInteger(order.tokensCount)).toBe(true);
        expect(order.amountCents).toBe(tokensToAmountCents(order.tokensCount));
        expect(['PENDING', 'COMPLETED', 'CANCELLED']).toContain(order.status);
        expect(Number.isNaN(Date.parse(order.createdAt))).toBe(false);
      }

      for (const payment of db.payments) {
        expect(typeof payment.id).toBe('string');
        expect(orderIds.has(payment.orderId)).toBe(true);
        expect(typeof payment.gatewayPaymentId).toBe('string');
        expect(payment.gatewayPaymentId.length).toBeGreaterThan(0);
        expect(['PIX', 'CREDIT_CARD']).toContain(payment.method);
        expect(Number.isInteger(payment.amountCents)).toBe(true);
        expect(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).toContain(payment.status);
        expect(Number.isNaN(Date.parse(payment.createdAt))).toBe(false);
        expect('cardNumber' in payment).toBe(false);
        expect('cvv' in payment).toBe(false);
      }
    });
  });

  describe('HTTP and environment configuration (Assume que 2-3)', () => {
    it('configures environment.walletApiUrl, WALLET_API_URL token and HttpClient in appConfig', () => {
      TestBed.configureTestingModule({
        providers: [...appConfig.providers],
      });

      const apiUrl = TestBed.inject(WALLET_API_URL);
      const httpClient = TestBed.inject(HttpClient);

      expect(environment.walletApiUrl).toBe('http://localhost:3000');
      expect(apiUrl).toBe('http://localhost:3000');
      expect(httpClient).toBeTruthy();
    });
  });
});
