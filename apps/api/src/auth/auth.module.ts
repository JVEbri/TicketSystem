import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LocalAuthService } from './application/adapters/local-auth.service';
import { KeycloakAuthService } from './application/adapters/keycloak-auth.service';
import { AuthController } from './presentation/auth.controller';
import { AuthSetupController } from './presentation/auth-setup.controller';
import { UsersModule } from '../users/users.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AUTH_PORT } from './application/ports/auth.port';

@Module({
  imports: [UsersModule, ConfigModule],
  controllers: [AuthController, AuthSetupController],
  providers: [
    LocalAuthService,
    KeycloakAuthService,
    {
      provide: AUTH_PORT,
      useFactory: (
        configService: ConfigService,
        localAuth: LocalAuthService,
        keycloakAuth: KeycloakAuthService,
      ) => {
        const jwksUrl = configService.get<string>('JWKS_URL');
        return jwksUrl ? keycloakAuth : localAuth;
      },
      inject: [ConfigService, LocalAuthService, KeycloakAuthService],
    },
    AuthService,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
