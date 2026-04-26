import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority, TicketStatus } from '../../domain/ticket.enums';

export class TicketDto {
  @ApiProperty({ example: '6d4b6f07-9b78-4ef3-9cbe-c278e5f9db1b' })
  id!: string;

  @ApiProperty({ example: 1 })
  reference!: number;

  @ApiProperty({ example: 'No puedo iniciar sesión' })
  title!: string;

  @ApiPropertyOptional({ example: 'Al intentar entrar, me da error 500' })
  description!: string | null;

  @ApiProperty({ enum: TicketStatus, example: TicketStatus.OPEN })
  status!: TicketStatus;

  @ApiProperty({ enum: TicketPriority, example: TicketPriority.MEDIUM })
  priority!: TicketPriority;

  @ApiPropertyOptional({ example: 'juan' })
  reporterUser!: string | null;

  @ApiPropertyOptional({ example: 'juan@empresa.com' })
  reporterEmail!: string | null;

  @ApiPropertyOptional({ example: 'Empresa S.L.' })
  reporterOrg!: string | null;

  @ApiPropertyOptional({ example: 'agent-123' })
  assignedAgentId!: string | null;

  @ApiProperty({ example: '2026-04-25T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-04-25T10:05:00.000Z' })
  updatedAt!: Date;
}
