import { Controller, Get, Post, Body } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../../users/application/users.service';
import { AuthService } from '../auth.service';

class SetupResponseDto {
  hasUsers!: boolean;
  authMode!: 'local' | 'keycloak';
}

class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  displayName?: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthSetupController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Verificar configuración de auth' })
  @ApiResponse({ type: SetupResponseDto })
  @Get('setup')
  async checkSetup(): Promise<SetupResponseDto> {
    const hasUsers = await this.usersService.hasUsers();
    const authMode = this.authService.getMode();
    return { hasUsers, authMode };
  }

  @ApiOperation({
    summary: 'Registrar primer usuario (solo si no hay usuarios y modo local)',
  })
  @Post('register')
  async register(@Body() body: RegisterDto) {
    const hasUsers = await this.usersService.hasUsers();
    if (hasUsers) {
      throw new Error('Users already exist');
    }

    const authMode = this.authService.getMode();
    if (authMode !== 'local') {
      throw new Error('Cannot register in Keycloak mode');
    }

    const hashedPassword = await this.authService.hashPassword(body.password);

    const user = await this.usersService.createUser({
      email: body.email,
      password: hashedPassword,
      displayName: body.displayName,
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };
  }
}
