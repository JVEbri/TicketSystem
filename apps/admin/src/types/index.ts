export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type Ticket = {
  id: string;
  reference: number;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  reporterUser: string | null;
  reporterEmail: string | null;
  reporterOrg: string | null;
  assignedAgentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type TicketsFilters = {
  status?: TicketStatus;
  priority?: TicketPriority;
  q?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'status' | 'priority';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type User = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type SetupResponse = {
  hasUsers: boolean;
  authMode: "local" | "keycloak";
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  displayName?: string;
};

export type AuthMode = "local" | "keycloak";

export function formatTicketRef(ref: number): string {
  return `TKT-${String(ref).padStart(4, '0')}`;
}