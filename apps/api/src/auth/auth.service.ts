import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  AUTH_PORT,
  KeycloakExchangeResult,
} from './application/ports/auth.port';
import type { AuthPort } from './application/ports/auth.port';
import { AuthMode, TokenInput } from './domain/auth.types';
import { KeycloakAuthService } from './application/adapters/keycloak-auth.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly adapter: AuthPort;

  constructor(
    @Inject(AUTH_PORT) authPort: AuthPort,
    private readonly keycloakAuth: KeycloakAuthService,
  ) {
    this.adapter = authPort;
    this.logger.log(`Auth initialized in ${this.adapter.getMode()} mode`);
  }

  getMode(): AuthMode {
    return this.adapter.getMode();
  }

  async validateToken(token: string) {
    return this.adapter.validateToken(token);
  }

  async generateToken(user: TokenInput) {
    return this.adapter.generateToken(user);
  }

  async hashPassword(password: string) {
    return this.adapter.hashPassword(password);
  }

  async verifyPassword(password: string, hash: string) {
    return this.adapter.verifyPassword(password, hash);
  }

  async exchangeKeycloakCode(
    code: string,
  ): Promise<KeycloakExchangeResult | null> {
    this.logger.log('Exchanging Keycloak code...');
    const result = await this.keycloakAuth.exchangeCode(code);
    if (!result) {
      this.logger.error('Keycloak code exchange failed');
      return null;
    }
    this.logger.log(`Keycloak user: ${result.user.email}`);
    return result;
  }

  async refreshKeycloakToken(
    refreshToken: string,
  ): Promise<KeycloakExchangeResult | null> {
    this.logger.log('Refreshing Keycloak token...');
    const result = await this.keycloakAuth.refreshToken(refreshToken);
    if (!result) {
      this.logger.error('Keycloak token refresh failed');
      return null;
    }
    this.logger.log(`Token refreshed for user: ${result.user.email}`);
    return result;
  }
}
