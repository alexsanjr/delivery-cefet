import { DomainEvent } from '../../../../shared/interfaces/domain-event.interface';

export class OrderCancelledEvent implements DomainEvent {
  readonly occurredOn: Date;
  readonly eventName = 'OrderCancelled';
  readonly aggregateId: number;

  constructor(
    public readonly orderId: number,
    public readonly reason?: string,
  ) {
    this.occurredOn = new Date();
    this.aggregateId = orderId;
  }

  get payload() {
    return {
      orderId: this.orderId,
      reason: this.reason,
      occurredOn: this.occurredOn,
    };
  }
}
