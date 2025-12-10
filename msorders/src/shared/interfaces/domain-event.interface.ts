export interface DomainEvent {
  readonly occurredOn: Date;
  readonly eventName: string;
  readonly aggregateId: string | number;
}
