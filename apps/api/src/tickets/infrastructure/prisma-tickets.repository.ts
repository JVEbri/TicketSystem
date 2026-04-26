import { Ticket as PrismaTicket, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Ticket } from '../domain/ticket';
import { TicketPriority, TicketStatus } from '../domain/ticket.enums';
import {
  TicketNotFoundError,
  InvalidStatusTransitionError,
} from '../domain/errors/ticket.errors';
import {
  CreateTicketInput,
  TicketsListOptions,
  TicketsRepository,
  TicketsListResult,
} from '../application/ports/tickets-repository';

function toDomain(ticket: PrismaTicket): Ticket {
  return new Ticket({
    id: ticket.id,
    reference: ticket.reference,
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
  });
}

@Injectable()
export class PrismaTicketsRepository implements TicketsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateTicketInput): Promise<Ticket> {
    const counter = await this.prisma.ticketCounter.upsert({
      where: { id: 'main' },
      update: { value: { increment: 1 } },
      create: { id: 'main', value: 1 },
    });

    const created = await this.prisma.ticket.create({
      data: {
        reference: counter.value,
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

  async findMany(options: TicketsListOptions): Promise<TicketsListResult> {
    const {
      status,
      priority,
      search,
      sortBy,
      sortOrder,
      limit = 0,
      offset = 0,
    } = options;

    const where: Prisma.TicketWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { reporterEmail: { contains: search } },
        { reporterUser: { contains: search } },
        { reporterOrg: { contains: search } },
      ];
    }

    const orderBy: Prisma.TicketOrderByWithRelationInput = {
      [sortBy || 'createdAt']: sortOrder || 'desc',
    };

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy,
        take: limit === 0 ? undefined : limit,
        skip: offset,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      tickets: tickets.map(toDomain),
      total,
    };
  }

  async updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new TicketNotFoundError(id);
    }

    if (!existing.canTransitionTo(status)) {
      throw new InvalidStatusTransitionError(existing.status, status);
    }

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
        throw new TicketNotFoundError(id);
      }
      throw err;
    }
  }
}
