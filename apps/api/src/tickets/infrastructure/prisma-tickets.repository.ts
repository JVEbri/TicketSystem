import {
  Ticket as PrismaTicket,
  TicketPriority as PrismaTicketPriority,
  TicketStatus as PrismaTicketStatus,
} from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Ticket } from '../domain/ticket';
import { TicketPriority, TicketStatus } from '../domain/ticket.enums';
import {
  CreateTicketInput,
  TicketsListFilter,
  TicketsRepository,
} from '../application/ports/tickets-repository';

function toDomain(ticket: PrismaTicket): Ticket {
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status as TicketStatus,
    priority: ticket.priority as TicketPriority,
    reporterUser: ticket.reporterUser,
    reporterEmail: ticket.reporterEmail,
    reporterOrg: ticket.reporterOrg,
    assignedAgentId: ticket.assignedAgentId,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

@Injectable()
export class PrismaTicketsRepository implements TicketsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateTicketInput): Promise<Ticket> {
    const created = await this.prisma.ticket.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority ?? TicketPriority.MEDIUM,
        reporterUser: input.reporterUser,
        reporterEmail: input.reporterEmail,
        reporterOrg: input.reporterOrg,
      },
    });

    return toDomain(created);
  }

  async findById(id: string): Promise<Ticket | null> {
    const found = await this.prisma.ticket.findUnique({ where: { id } });
    return found ? toDomain(found) : null;
  }

  async findMany(filter: TicketsListFilter): Promise<Ticket[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        status: filter.status
          ? (filter.status as PrismaTicketStatus)
          : undefined,
        priority: filter.priority
          ? (filter.priority as PrismaTicketPriority)
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map(toDomain);
  }

  async updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
    try {
      const updated = await this.prisma.ticket.update({
        where: { id },
        data: { status: status },
      });
      return toDomain(updated);
    } catch (err) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new Error('NOT_FOUND');
      }
      throw err;
    }
  }
}
