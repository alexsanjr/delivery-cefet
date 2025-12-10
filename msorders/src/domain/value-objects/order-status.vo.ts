import { ValueObject } from '../../shared/interfaces';

export enum OrderStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  ARRIVING = 'ARRIVING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

interface OrderStatusProps {
  value: OrderStatusEnum;
}

export class OrderStatus extends ValueObject<OrderStatusProps> {
  private constructor(props: OrderStatusProps) {
    super(props);
  }

  static create(value: OrderStatusEnum): OrderStatus {
    return new OrderStatus({ value });
  }

  static pending(): OrderStatus {
    return new OrderStatus({ value: OrderStatusEnum.PENDING });
  }

  static confirmed(): OrderStatus {
    return new OrderStatus({ value: OrderStatusEnum.CONFIRMED });
  }

  static preparing(): OrderStatus {
    return new OrderStatus({ value: OrderStatusEnum.PREPARING });
  }

  static outForDelivery(): OrderStatus {
    return new OrderStatus({ value: OrderStatusEnum.OUT_FOR_DELIVERY });
  }

  static arriving(): OrderStatus {
    return new OrderStatus({ value: OrderStatusEnum.ARRIVING });
  }

  static delivered(): OrderStatus {
    return new OrderStatus({ value: OrderStatusEnum.DELIVERED });
  }

  static cancelled(): OrderStatus {
    return new OrderStatus({ value: OrderStatusEnum.CANCELLED });
  }

  get value(): OrderStatusEnum {
    return this.props.value;
  }

  canTransitionTo(newStatus: OrderStatus): boolean {
    const transitions: Record<OrderStatusEnum, OrderStatusEnum[]> = {
      [OrderStatusEnum.PENDING]: [
        OrderStatusEnum.CONFIRMED,
        OrderStatusEnum.CANCELLED,
      ],
      [OrderStatusEnum.CONFIRMED]: [
        OrderStatusEnum.PREPARING,
        OrderStatusEnum.CANCELLED,
      ],
      [OrderStatusEnum.PREPARING]: [
        OrderStatusEnum.OUT_FOR_DELIVERY,
        OrderStatusEnum.CANCELLED,
      ],
      [OrderStatusEnum.OUT_FOR_DELIVERY]: [
        OrderStatusEnum.ARRIVING,
        OrderStatusEnum.CANCELLED,
      ],
      [OrderStatusEnum.ARRIVING]: [
        OrderStatusEnum.DELIVERED,
        OrderStatusEnum.CANCELLED,
      ],
      [OrderStatusEnum.DELIVERED]: [],
      [OrderStatusEnum.CANCELLED]: [],
    };

    return transitions[this.value].includes(newStatus.value);
  }

  isPending(): boolean {
    return this.value === OrderStatusEnum.PENDING;
  }

  isDelivered(): boolean {
    return this.value === OrderStatusEnum.DELIVERED;
  }

  isCancelled(): boolean {
    return this.value === OrderStatusEnum.CANCELLED;
  }

  isFinal(): boolean {
    return this.isDelivered() || this.isCancelled();
  }

  toString(): string {
    return this.value;
  }
}
