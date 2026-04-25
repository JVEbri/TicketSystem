import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { TicketPriority } from '../../domain/ticket.enums';

export class CreateTicketDto {
  @ApiProperty({ example: 'No puedo iniciar sesión' })
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiPropertyOptional({ example: 'Al intentar entrar, me da error 500' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TicketPriority, example: TicketPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ example: 'juan' })
  @IsOptional()
  @IsString()
  reporterUser?: string;

  @ApiPropertyOptional({ example: 'juan@empresa.com' })
  @IsOptional()
  @IsEmail()
  reporterEmail?: string;

  @ApiPropertyOptional({ example: 'Empresa S.L.' })
  @IsOptional()
  @IsString()
  reporterOrg?: string;
}
