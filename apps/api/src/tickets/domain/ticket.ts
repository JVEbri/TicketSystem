import { TicketPriority, TicketStatus } from './ticket.enums';

export type Ticket = {
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
};
