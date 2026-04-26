import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TicketsService } from '../application/tickets.service';
import {
  TicketsSortBy,
  SortOrder,
} from '../application/ports/tickets-repository';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketDto } from './dto/ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { Ticket } from '../domain/ticket';

const VALID_SORT_BY: TicketsSortBy[] = [
  'createdAt',
  'updatedAt',
  'title',
  'status',
  'priority',
];
const VALID_SORT_ORDER: SortOrder[] = ['asc', 'desc'];

function toTicketDto(ticket: Ticket): TicketDto {
  return {
    id: ticket.id,
    reference: ticket.reference,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    reporterUser: ticket.reporterUser,
    reporterEmail: ticket.reporterEmail,
    reporterOrg: ticket.reporterOrg,
    assignedAgentId: ticket.assignedAgentId,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

class PaginatedTicketsDto {
  data!: TicketDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
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

  @ApiOperation({
    summary: 'Listar tickets (admin) con filtros, búsqueda y paginación',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: PaginatedTicketsDto })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page. 0 = no limit (all)',
  })
  @Get('admin/tickets')
  async listTickets(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('q') q?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedTicketsDto> {
    const parsedStatus = this.ticketsService.parseStatus(status);
    const parsedPriority = this.ticketsService.parsePriority(priority);

    const limitNum = parseInt(limit || '20', 10);
    const pageNum = limitNum === 0 ? 1 : Math.max(1, parseInt(page || '1', 10));
    const effectiveLimit =
      limitNum === 0 ? 0 : Math.min(100, Math.max(1, limitNum));
    const offset = (pageNum - 1) * effectiveLimit;

    const result = await this.ticketsService.listTickets({
      status: parsedStatus,
      priority: parsedPriority,
      search: q,
      sortBy: VALID_SORT_BY.includes(sortBy as TicketsSortBy)
        ? (sortBy as TicketsSortBy)
        : 'createdAt',
      sortOrder: VALID_SORT_ORDER.includes(sortOrder as SortOrder)
        ? (sortOrder as SortOrder)
        : 'desc',
      limit: effectiveLimit,
      offset,
    });

    return {
      data: result.tickets.map(toTicketDto),
      total: result.total,
      page: limitNum === 0 ? 1 : pageNum,
      limit: limitNum === 0 ? result.total : effectiveLimit,
      totalPages: limitNum === 0 ? 1 : Math.ceil(result.total / effectiveLimit),
    };
  }

  @ApiOperation({ summary: 'Obtener un ticket por id (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: TicketDto })
  @ApiParam({ name: 'id', type: String })
  @Get('admin/tickets/:id')
  async getTicket(@Param('id') id: string): Promise<TicketDto> {
    const ticket = await this.ticketsService.getTicket(id);
    return toTicketDto(ticket);
  }

  @ApiOperation({ summary: 'Actualizar estado de un ticket (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
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
