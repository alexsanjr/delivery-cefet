import { Inject, Injectable } from '@nestjs/common';
import type { IOrderRepository } from '../../../domain/repositories/order.repository.interface';
import { ORDER_REPOSITORY } from '../../../domain/repositories/order.repository.interface';
import { OrderResponseDto } from '../../dto/order-response.dto';

@Injectable()
export class ListOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(customerId?: number): Promise<OrderResponseDto[]> {
    const orders = customerId
      ? await this.orderRepository.findByCustomerId(customerId)
      : await this.orderRepository.findAll();

    return orders.map((order) => ({
      id: order.id,
      customerId: order.customerId,
      status: order.status.value,
      paymentMethod: order.paymentMethod.value,
      deliveryAddress: order.deliveryAddress.toString(),
      deliveryFee: order.deliveryFee.amount,
      subtotal: order.subtotal.amount,
      total: order.total.amount,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      currency: order.total.currency,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.amount,
        subtotal: item.subtotal.amount,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));
  }
}
