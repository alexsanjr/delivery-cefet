import { DomainEvent } from '../../../../shared/interfaces/domain-event.interface';
import { OrderStatus } from '../../../value-objects/order-status.vo';

export class OrderStatusChangedEvent implements DomainEvent {
  readonly occurredOn: Date;
  readonly eventName = 'OrderStatusChanged';
  readonly aggregateId: number;

  constructor(
    public readonly orderId: number,
    public readonly previousStatus: OrderStatus,
    public readonly newStatus: OrderStatus,
  ) {
    this.occurredOn = new Date();
    this.aggregateId = orderId;
  }

  get payload() {
    return {
      orderId: this.orderId,
      previousStatus: this.previousStatus.value,
      newStatus: this.newStatus.value,
      occurredOn: this.occurredOn,
    };
  }
}
