import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  Logger,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from '../../auth/auth.service';
import { LoginDto, AuthResponseDto } from './dto/auth.dto';
import { UsersService } from '../../users/application/users.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @Post('login')
  async login(@Body() body: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.getUserByEmail(body.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.authService.verifyPassword(
      body.password,
      user.password!,
    );

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.authService.generateToken({
      id: user.id,
      email: user.email,
      displayName: user.displayName || undefined,
    });

    return {
      token,
      expiresIn: 86400,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  @ApiOperation({
    summary: 'Callback de Keycloak (intercambia code por sesión)',
  })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @Post('keycloak/callback')
  async keycloakCallback(
    @Body() body: { code: string },
  ): Promise<AuthResponseDto> {
    this.logger.log('Keycloak callback received');

    const result = await this.authService.exchangeKeycloakCode(body.code);
    if (!result) {
      throw new UnauthorizedException('Failed to exchange code with Keycloak');
    }

    let user = await this.usersService.getUserByEmail(result.user.email);
    if (!user) {
      this.logger.log(`Creating new user from Keycloak: ${result.user.email}`);
      user = await this.usersService.createUser({
        email: result.user.email,
        displayName: result.user.displayName || undefined,
        avatarUrl: result.user.avatarUrl || undefined,
      });
    }

    return {
      token: result.token,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  @ApiOperation({ summary: 'Refrescar token de Keycloak' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @Post('refresh')
  async refreshToken(
    @Body() body: { refreshToken: string },
  ): Promise<AuthResponseDto> {
    this.logger.log('Refresh token request received');

    const result = await this.authService.refreshKeycloakToken(
      body.refreshToken,
    );
    if (!result) {
      throw new UnauthorizedException('Failed to refresh token');
    }

    return {
      token: result.token,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      user: {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
        avatarUrl: result.user.avatarUrl,
      },
    };
  }

  @ApiOperation({ summary: 'Obtener usuario actual' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Usuario actual' })
  @Get('me')
  getCurrentUser(@Request() req: { user?: Record<string, unknown> }) {
    return { user: req.user };
  }
}
