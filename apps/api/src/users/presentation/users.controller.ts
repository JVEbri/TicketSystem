import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from '../application/users.service';
import { CreateUserDto, UserResponseDto } from './dto/users.dto';
import { User } from '../domain/user';

function toUserDto(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Crear usuario local' })
  @ApiCreatedResponse({ type: UserResponseDto, description: 'Usuario creado' })
  @Post()
  async createUser(@Body() body: CreateUserDto): Promise<UserResponseDto> {
    const created = await this.usersService.createUser({
      email: body.email,
      password: body.password,
      displayName: body.displayName,
    });
    return toUserDto(created);
  }

  @ApiOperation({ summary: 'Obtener usuario actual' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @Get('me')
  getCurrentUser(): Promise<UserResponseDto> {
    throw new Error('Not implemented - requires JWT guard');
  }
}
