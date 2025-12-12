import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { OrderResponseDto } from '../../dto/order-response.dto';
import type { IOrderRepository } from '../../../domain/repositories/order.repository.interface';
import { ORDER_REPOSITORY } from '../../../domain/repositories/order.repository.interface';

@Injectable()
export class GetOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(orderId: number): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    return {
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
    };
  }
}
