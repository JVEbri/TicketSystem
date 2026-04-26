import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createLocalJWKSet, jwtVerify } from 'jose';
import { AuthPort } from '../ports/auth.port';
import type {
  AuthenticatedUser,
  AuthMode,
  TokenInput,
} from '../../domain/auth.types';

interface KeycloakTokenResult {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

class KeycloakNotSupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KeycloakNotSupportedError';
  }
}

interface JwtPayload {
  sub: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  picture?: string;
}

@Injectable()
export class KeycloakAuthService implements AuthPort {
  private readonly jwksUrl: string;
  private readonly issuer: string;

  constructor(private readonly configService: ConfigService) {
    this.jwksUrl = this.configService.get<string>('JWKS_URL') || '';
    this.issuer = this.configService.get<string>('KEYCLOAK_ISSUER') || '';
  }

  getMode(): AuthMode {
    return 'keycloak';
  }

  async validateToken(token: string): Promise<AuthenticatedUser | null> {
    const logger = new Logger(KeycloakAuthService.name);

    try {
      const jwksUrl = new URL(this.jwksUrl);
      const jwksResponse = await fetch(jwksUrl);
      const jwksData = (await jwksResponse.json()) as {
        keys: Array<Record<string, unknown>>;
      };
      const signingKeys = jwksData.keys.filter((key) => key.use === 'sig');
      const filteredJwks = { keys: signingKeys };

      const localJwks = createLocalJWKSet(filteredJwks);

      const { payload } = await jwtVerify(token, localJwks, {
        issuer: this.issuer,
        algorithms: ['RS256', 'RS384', 'RS512'],
      });

      const claims = payload as unknown as JwtPayload;

      return {
        id: claims.sub,
        email: claims.email || claims.preferred_username || '',
        displayName: claims.name || claims.preferred_username || null,
        avatarUrl: claims.picture || null,
      };
    } catch (err) {
      const error = err as Error;
      logger.error(`Token validation error: ${error.message}`);
      return null;
    }
  }

  generateToken(_user: TokenInput): Promise<string> {
    return Promise.reject(
      new KeycloakNotSupportedError(
        'Cannot generate tokens in Keycloak mode - use Keycloak to obtain tokens',
      ),
    );
  }

  hashPassword(_password: string): Promise<string> {
    return Promise.reject(
      new KeycloakNotSupportedError('Not available in Keycloak mode'),
    );
  }

  verifyPassword(_password: string, _hash: string): Promise<boolean> {
    return Promise.reject(
      new KeycloakNotSupportedError('Not available in Keycloak mode'),
    );
  }

  async exchangeCode(code: string): Promise<KeycloakTokenResult | null> {
    const logger = new Logger(KeycloakAuthService.name);

    const keycloakUrl = this.configService.get<string>('KEYCLOAK_URL') || '';
    const keycloakRealm =
      this.configService.get<string>('KEYCLOAK_REALM') || '';
    const clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID') || '';
    const clientSecret = this.configService.get<string>(
      'KEYCLOAK_CLIENT_SECRET',
    );
    const redirectUri =
      this.configService.get<string>('KEYCLOAK_REDIRECT_URI') || '';

    if (!keycloakUrl || !keycloakRealm || !clientId || !redirectUri) {
      logger.error('Missing Keycloak configuration');
      return null;
    }

    const tokenUrl = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`;

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
    });

    if (clientSecret) {
      params.append('client_secret', clientSecret);
    }

    logger.log('Exchanging code for token with Keycloak...');
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error(`Keycloak token exchange failed: ${errorText}`);
      return null;
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
    logger.log('Tokens received from Keycloak');

    const user = await this.validateToken(tokenData.access_token);
    if (!user) {
      return null;
    }

    return {
      token: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      user,
    };
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<KeycloakTokenResult | null> {
    const logger = new Logger(KeycloakAuthService.name);

    const keycloakUrl = this.configService.get<string>('KEYCLOAK_URL') || '';
    const keycloakRealm =
      this.configService.get<string>('KEYCLOAK_REALM') || '';
    const clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID') || '';
    const clientSecret = this.configService.get<string>(
      'KEYCLOAK_CLIENT_SECRET',
    );

    if (!keycloakUrl || !keycloakRealm || !clientId) {
      logger.error('Missing Keycloak configuration');
      return null;
    }

    const tokenUrl = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`;

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
    });

    if (clientSecret) {
      params.append('client_secret', clientSecret);
    }

    logger.log('Refreshing token with Keycloak...');
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error(`Keycloak refresh failed: ${errorText}`);
      return null;
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    const user = await this.validateToken(tokenData.access_token);
    if (!user) {
      return null;
    }

    return {
      token: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      user,
    };
  }
}
