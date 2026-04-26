import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TicketPriority, TicketStatus } from '../domain/ticket.enums';
import { InvalidStatusTransitionError } from '../domain/errors/ticket.errors';
import {
  CreateTicketInput,
  TICKETS_REPOSITORY,
  TicketsListOptions,
  TicketsListResult,
} from './ports/tickets-repository';
import type { TicketsRepository } from './ports/tickets-repository';

@Injectable()
export class TicketsService {
  constructor(
    @Inject(TICKETS_REPOSITORY) private readonly ticketsRepo: TicketsRepository,
  ) {}

  createTicket(input: CreateTicketInput) {
    return this.ticketsRepo.create(input);
  }

  listTickets(options: TicketsListOptions): Promise<TicketsListResult> {
    return this.ticketsRepo.findMany(options);
  }

  async getTicket(id: string) {
    const ticket = await this.ticketsRepo.findById(id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async updateStatus(id: string, status: TicketStatus) {
    try {
      return await this.ticketsRepo.updateStatus(id, status);
    } catch (err) {
      if (err instanceof InvalidStatusTransitionError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  parseStatus(value: string | undefined): TicketStatus | undefined {
    if (!value) return undefined;
    if (!(value in TicketStatus)) return undefined;
    return TicketStatus[value as keyof typeof TicketStatus];
  }

  parsePriority(value: string | undefined): TicketPriority | undefined {
    if (!value) return undefined;
    if (!(value in TicketPriority)) return undefined;
    return TicketPriority[value as keyof typeof TicketPriority];
  }
}
