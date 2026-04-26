export class TicketNotFoundError extends Error {
  constructor(id: string) {
    super(`Ticket ${id} not found`);
    this.name = 'TicketNotFoundError';
  }
}

export class InvalidStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot transition from ${from} to ${to}`);
    this.name = 'InvalidStatusTransitionError';
  }
}
