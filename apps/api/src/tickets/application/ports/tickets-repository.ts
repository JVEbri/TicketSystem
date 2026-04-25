import { TicketPriority, TicketStatus } from '../../domain/ticket.enums';
import { Ticket } from '../../domain/ticket';

export type CreateTicketInput = {
  title: string;
  description?: string;
  priority?: TicketPriority;
  reporterUser?: string;
  reporterEmail?: string;
  reporterOrg?: string;
};

export type TicketsListFilter = {
  status?: TicketStatus;
  priority?: TicketPriority;
};

export const TICKETS_REPOSITORY = 'TICKETS_REPOSITORY';

export interface TicketsRepository {
  create(input: CreateTicketInput): Promise<Ticket>;
  findById(id: string): Promise<Ticket | null>;
  findMany(filter: TicketsListFilter): Promise<Ticket[]>;
  updateStatus(id: string, status: TicketStatus): Promise<Ticket>;
}
