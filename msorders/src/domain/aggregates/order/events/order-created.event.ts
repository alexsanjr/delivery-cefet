import { DomainEvent } from '../../../../shared/interfaces/domain-event.interface';
import { Order } from '../order.aggregate';

export class OrderCreatedEvent implements DomainEvent {
  readonly occurredOn: Date;
  readonly eventName = 'OrderCreated';
  readonly aggregateId: number;

  constructor(public readonly order: Order) {
    this.occurredOn = new Date();
    this.aggregateId = order.id;
  }

  get payload() {
    return {
      orderId: this.order.id,
      customerId: this.order.customerId,
      status: this.order.status.value,
      total: this.order.total.amount,
      itemsCount: this.order.items.length,
      deliveryAddress: this.order.deliveryAddress.toString(),
      occurredOn: this.occurredOn,
    };
  }
}
