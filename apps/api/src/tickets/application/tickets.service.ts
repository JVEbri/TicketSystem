import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TicketPriority, TicketStatus } from '../domain/ticket.enums';
import {
  CreateTicketInput,
  TICKETS_REPOSITORY,
  TicketsListFilter,
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

  listTickets(filter: TicketsListFilter) {
    return this.ticketsRepo.findMany(filter);
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
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        throw new NotFoundException('Ticket not found');
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
