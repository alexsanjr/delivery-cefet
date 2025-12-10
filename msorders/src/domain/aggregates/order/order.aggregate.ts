import { AggregateRoot } from '../../../shared/interfaces/aggregate-root.interface';
import { OrderItem } from '../../entities/order-item.entity';
import { Money } from '../../value-objects/money.vo';
import {
  OrderStatus,
  OrderStatusEnum,
} from '../../value-objects/order-status.vo';
import { Address } from '../../value-objects/address.vo';
import { PaymentMethod } from '../../value-objects/payment-method.vo';
import { DomainException } from '../../../shared/exceptions/domain.exception';
import { OrderCreatedEvent } from './events/order-created.event';
import { OrderStatusChangedEvent } from './events/order-status-changed.event';
import { OrderCancelledEvent } from './events/order-cancelled.event';

export interface CreateOrderProps {
  customerId: number;
  items: OrderItem[];
  deliveryAddress: Address;
  paymentMethod: PaymentMethod;
  deliveryFee?: Money;
  notes?: string;
}

export interface OrderProps extends CreateOrderProps {
  id?: number;
  status: OrderStatus;
  total: Money;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Order extends AggregateRoot {
  private _id: number;
  private readonly _customerId: number;
  private _items: OrderItem[];
  private _status: OrderStatus;
  private _total: Money;
  private readonly _deliveryAddress: Address;
  private readonly _paymentMethod: PaymentMethod;
  private readonly _deliveryFee: Money;
  private readonly _notes?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: OrderProps) {
    super();
    this._id = props.id!;
    this._customerId = props.customerId;
    this._items = props.items;
    this._status = props.status;
    this._total = props.total;
    this._deliveryAddress = props.deliveryAddress;
    this._paymentMethod = props.paymentMethod;
    this._deliveryFee = props.deliveryFee || Money.zero();
    this._notes = props.notes;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  static create(props: CreateOrderProps): Order {
    // Validações de domínio
    if (!props.customerId || props.customerId <= 0) {
      throw new DomainException('Customer ID is required');
    }

    if (!props.items || props.items.length === 0) {
      throw new DomainException('Order must have at least one item');
    }

    if (!props.deliveryAddress) {
      throw new DomainException('Delivery address is required');
    }

    // Criar ordem com status inicial
    const order = new Order({
      ...props,
      status: OrderStatus.pending(),
      total: Money.zero(),
      deliveryFee: props.deliveryFee || Money.zero(),
    });

    // Calcular total
    order.calculateTotal();

    // Adicionar evento de domínio
    order.addDomainEvent(new OrderCreatedEvent(order));

    return order;
  }

  static reconstitute(id: number, props: Omit<OrderProps, 'id'>): Order {
    return new Order({ ...props, id });
  }

  private calculateTotal(): void {
    const itemsTotal = this._items.reduce(
      (sum, item) => sum.add(item.subtotal),
      Money.zero(),
    );

    this._total = itemsTotal.add(this._deliveryFee);
  }

  updateStatus(newStatus: OrderStatus): void {
    if (!this._status.canTransitionTo(newStatus)) {
      throw new DomainException(
        `Cannot transition from ${this._status.value} to ${newStatus.value}`,
      );
    }

    const previousStatus = this._status;
    this._status = newStatus;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new OrderStatusChangedEvent(this._id, previousStatus, newStatus),
    );
  }

  confirm(): void {
    this.updateStatus(OrderStatus.confirmed());
  }

  startPreparing(): void {
    this.updateStatus(OrderStatus.preparing());
  }

  dispatchForDelivery(): void {
    this.updateStatus(OrderStatus.outForDelivery());
  }

  markAsArriving(): void {
    this.updateStatus(OrderStatus.arriving());
  }

  markAsDelivered(): void {
    this.updateStatus(OrderStatus.delivered());
  }

  cancel(reason?: string): void {
    if (this._status.isFinal()) {
      throw new DomainException('Cannot cancel a finalized order');
    }

    this._status = OrderStatus.cancelled();
    this._updatedAt = new Date();

    this.addDomainEvent(new OrderCancelledEvent(this._id, reason));
  }

  // Getters
  get id(): number {
    return this._id;
  }

  get customerId(): number {
    return this._customerId;
  }

  get items(): ReadonlyArray<OrderItem> {
    return [...this._items];
  }

  get status(): OrderStatus {
    return this._status;
  }

  get total(): Money {
    return this._total;
  }

  get deliveryAddress(): Address {
    return this._deliveryAddress;
  }

  get paymentMethod(): PaymentMethod {
    return this._paymentMethod;
  }

  get deliveryFee(): Money {
    return this._deliveryFee;
  }

  get notes(): string | undefined {
    return this._notes;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  isPending(): boolean {
    return this._status.isPending();
  }

  isDelivered(): boolean {
    return this._status.isDelivered();
  }

  isCancelled(): boolean {
    return this._status.isCancelled();
  }

  canBeCancelled(): boolean {
    return !this._status.isFinal();
  }
}
