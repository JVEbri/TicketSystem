import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TicketsService } from '../application/tickets.service';
import { TicketPriority, TicketStatus } from '../domain/ticket.enums';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketDto } from './dto/ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';

function toTicketDto(ticket: {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  reporterUser: string | null;
  reporterEmail: string | null;
  reporterOrg: string | null;
  assignedAgentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TicketDto {
  return ticket;
}

@ApiTags('Tickets')
@Controller()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @ApiOperation({ summary: 'Crear un ticket (público)' })
  @ApiCreatedResponse({ type: TicketDto })
  @Post('tickets')
  async createTicket(@Body() body: CreateTicketDto): Promise<TicketDto> {
    const created = await this.ticketsService.createTicket(body);
    return toTicketDto(created);
  }

  @ApiOperation({ summary: 'Listar tickets (admin)' })
  @ApiOkResponse({ type: [TicketDto] })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TicketPriority })
  @Get('admin/tickets')
  async listTickets(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ): Promise<TicketDto[]> {
    const parsedStatus = this.ticketsService.parseStatus(status);
    const parsedPriority = this.ticketsService.parsePriority(priority);
    const tickets = await this.ticketsService.listTickets({
      status: parsedStatus,
      priority: parsedPriority,
    });
    return tickets.map(toTicketDto);
  }

  @ApiOperation({ summary: 'Obtener un ticket por id (admin)' })
  @ApiOkResponse({ type: TicketDto })
  @ApiParam({ name: 'id', type: String })
  @Get('admin/tickets/:id')
  async getTicket(@Param('id') id: string): Promise<TicketDto> {
    const ticket = await this.ticketsService.getTicket(id);
    return toTicketDto(ticket);
  }

  @ApiOperation({ summary: 'Actualizar estado de un ticket (admin)' })
  @ApiOkResponse({ type: TicketDto })
  @ApiParam({ name: 'id', type: String })
  @Patch('admin/tickets/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateTicketStatusDto,
  ): Promise<TicketDto> {
    const updated = await this.ticketsService.updateStatus(id, body.status);
    return toTicketDto(updated);
  }
}
