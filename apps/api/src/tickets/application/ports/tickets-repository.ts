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

export type TicketsSortBy =
  | 'createdAt'
  | 'updatedAt'
  | 'title'
  | 'status'
  | 'priority';
export type SortOrder = 'asc' | 'desc';

export type TicketsListOptions = {
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
  sortBy?: TicketsSortBy;
  sortOrder?: SortOrder;
  limit?: number;
  offset?: number;
};

export type TicketsListResult = {
  tickets: Ticket[];
  total: number;
};

export const TICKETS_REPOSITORY = 'TICKETS_REPOSITORY';

export interface TicketsRepository {
  create(input: CreateTicketInput): Promise<Ticket>;
  findById(id: string): Promise<Ticket | null>;
  findMany(options: TicketsListOptions): Promise<TicketsListResult>;
  updateStatus(id: string, status: TicketStatus): Promise<Ticket>;
}
