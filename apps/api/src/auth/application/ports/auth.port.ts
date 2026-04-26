import type {
  AuthenticatedUser,
  AuthMode,
  TokenInput,
} from '../../domain/auth.types';

export interface KeycloakExchangeResult {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

export const AUTH_PORT = 'AUTH_PORT';

export interface AuthPort {
  getMode(): AuthMode;

  validateToken(token: string): Promise<AuthenticatedUser | null>;

  generateToken(user: TokenInput): Promise<string>;

  hashPassword(password: string): Promise<string>;

  verifyPassword(password: string, hash: string): Promise<boolean>;

  exchangeCode(code: string): Promise<KeycloakExchangeResult | null>;

  refreshToken(refreshToken: string): Promise<KeycloakExchangeResult | null>;
}
