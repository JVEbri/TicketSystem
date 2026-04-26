import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { AuthPort } from '../ports/auth.port';
import {
  AuthenticatedUser,
  AuthMode,
  TokenInput,
  TokenPayload,
} from '../../domain/auth.types';

@Injectable()
export class LocalAuthService implements AuthPort {
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    this.secret = this.configService.get<string>('JWT_SECRET') || '';
  }

  getMode(): AuthMode {
    return 'local';
  }

  async validateToken(token: string): Promise<AuthenticatedUser | null> {
    try {
      const payload = jwt.verify(token, this.secret) as TokenPayload;
      return {
        id: payload.sub,
        email: payload.email,
        displayName: payload.displayName || null,
        avatarUrl: null,
      };
    } catch {
      return null;
    }
  }

  generateToken(user: TokenInput): Promise<string> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
    };
    return Promise.resolve(
      jwt.sign(payload, this.secret, { expiresIn: '24h' }),
    );
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async exchangeCode(_code: string): Promise<null> {
    return null;
  }

  async refreshToken(_refreshToken: string): Promise<null> {
    return null;
  }
}
