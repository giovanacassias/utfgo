export type UserRole = 'PASSENGER' | 'DRIVER' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';

export interface User {
  id: string;
  name: string;
  email: string;
  campus: string;
  role: UserRole;
  status: UserStatus;
}

export interface RegistrationData {
  name: string;
  email: string;
  campus: string;
}

export type OtpPurpose = 'LOGIN' | 'REGISTRATION';

export interface OtpChallenge {
  email: string;
  code: string;
  expiresAt: string;
  purpose: OtpPurpose;
  registration?: RegistrationData;
}

export interface AuthSession {
  user: User;
  token: string;
  wallet?: Wallet;
}

export interface Wallet {
  id: string;
  userId: string;
  tokenBalance: number;
  penaltyPoints: number;
  updatedAt: string;
}
