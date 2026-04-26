import { TicketPriority, TicketStatus } from './ticket.enums';

export type TicketProps = {
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
  createdAt: Date;
  updatedAt: Date;
};

export class Ticket {
  private readonly _id: string;
  private readonly _reference: number;
  private readonly _title: string;
  private readonly _description: string | null;
  private _status: TicketStatus;
  private _priority: TicketPriority;
  private readonly _reporterUser: string | null;
  private readonly _reporterEmail: string | null;
  private readonly _reporterOrg: string | null;
  private _assignedAgentId: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private static readonly VALID_TRANSITIONS: Record<
    TicketStatus,
    TicketStatus[]
  > = {
    [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS],
    [TicketStatus.IN_PROGRESS]: [TicketStatus.OPEN, TicketStatus.RESOLVED],
    [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
    [TicketStatus.CLOSED]: [],
  };

  constructor(props: TicketProps) {
    this._id = props.id;
    this._reference = props.reference;
    this._title = props.title;
    this._description = props.description;
    this._status = props.status;
    this._priority = props.priority;
    this._reporterUser = props.reporterUser;
    this._reporterEmail = props.reporterEmail;
    this._reporterOrg = props.reporterOrg;
    this._assignedAgentId = props.assignedAgentId;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get id() {
    return this._id;
  }
  get reference() {
    return this._reference;
  }
  get title() {
    return this._title;
  }
  get description() {
    return this._description;
  }
  get status() {
    return this._status;
  }
  get priority() {
    return this._priority;
  }
  get reporterUser() {
    return this._reporterUser;
  }
  get reporterEmail() {
    return this._reporterEmail;
  }
  get reporterOrg() {
    return this._reporterOrg;
  }
  get assignedAgentId() {
    return this._assignedAgentId;
  }
  get createdAt() {
    return this._createdAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }

  canTransitionTo(targetStatus: TicketStatus): boolean {
    const allowed = Ticket.VALID_TRANSITIONS[this._status];
    return allowed.includes(targetStatus);
  }

  transitionTo(targetStatus: TicketStatus): void {
    if (!this.canTransitionTo(targetStatus)) {
      throw new Error(
        `Cannot transition from ${this._status} to ${targetStatus}`,
      );
    }
    this._status = targetStatus;
    this._updatedAt = new Date();
  }

  assignTo(agentId: string): void {
    if (this._status !== TicketStatus.OPEN) {
      throw new Error('Can only assign OPEN tickets');
    }
    this._assignedAgentId = agentId;
    this._updatedAt = new Date();
  }

  toProps(): TicketProps {
    return {
      id: this._id,
      reference: this._reference,
      title: this._title,
      description: this._description,
      status: this._status,
      priority: this._priority,
      reporterUser: this._reporterUser,
      reporterEmail: this._reporterEmail,
      reporterOrg: this._reporterOrg,
      assignedAgentId: this._assignedAgentId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
