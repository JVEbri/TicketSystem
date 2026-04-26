import { registerAs } from '@nestjs/config';

export const configuration = registerAs('config', () => ({
  jwksUrl: process.env.JWKS_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
}));

export type ConfigType = ReturnType<typeof configuration>;
