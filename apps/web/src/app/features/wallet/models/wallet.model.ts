// TODO #2: Replace simulated user ID with the authenticated user from AuthService (Issue #1).
export const SIMULATED_USER_ID = 'user-1';

export const TOKEN_UNIT_PRICE_CENTS = 200;
export const TOKEN_PACKAGES = [1, 5, 10, 20] as const;
export const MIN_TOKENS_PER_ORDER = 1;
export const MAX_TOKENS_PER_ORDER = 100;

export type UserRole = 'PASSENGER' | 'DRIVER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';
export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'PIX' | 'CREDIT_CARD';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type StatementFilter = 'ALL' | 'COMPLETED' | 'PENDING' | 'FAILED_OR_CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  tokenBalance: number;
  penaltyPoints: number;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  tokensCount: number;
  amountCents: number;
  status: OrderStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  gatewayPaymentId: string;
  method: PaymentMethod;
  amountCents: number;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
}

export interface WalletTransaction {
  order: Order;
  payments: Payment[];
  latestPayment: Payment | null;
}

export interface WalletDatabase {
  users: User[];
  wallets: Wallet[];
  orders: Order[];
  payments: Payment[];
}

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/** Converts a non-negative integer token count into exact BRL cents (RN05/06). */
export function tokensToAmountCents(tokensCount: number): number {
  if (!Number.isInteger(tokensCount) || tokensCount < 0) {
    throw new RangeError('tokensCount must be a non-negative integer.');
  }

  return tokensCount * TOKEN_UNIT_PRICE_CENTS;
}

/** Formats integer cents into a BRL currency string using a regular ASCII space. */
export function formatBrlFromCents(amountCents: number): string {
  if (!Number.isInteger(amountCents)) {
    throw new RangeError('amountCents must be an integer.');
  }

  return brlFormatter.format(amountCents / 100).replace(/\u00A0/g, ' ');
}
