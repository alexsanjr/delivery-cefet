import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  OrderStatus,
  OrderStatusEnum,
} from '../../../domain/value-objects/order-status.vo';
import type { IOrderRepository } from '../../../domain/repositories/order.repository.interface';
import { ORDER_REPOSITORY } from '../../../domain/repositories/order.repository.interface';
import type { INotificationSender } from '../../ports/notification-sender.port';
import { NOTIFICATION_SENDER } from '../../ports/notification-sender.port';
import { UpdateOrderStatusDto } from '../../dto/update-order-status.dto';
import { OrderResponseDto } from '../../dto/order-response.dto';
import { OrderEventsPublisher } from '../../../rabbitmq/events/order-events.publisher';
import { OrderStatusChangedEvent } from '../../../domain/aggregates/order/events/order-status-changed.event';
import { OrderCancelledEvent } from '../../../domain/aggregates/order/events/order-cancelled.event';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,

    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: INotificationSender,

    private readonly orderEventsPublisher: OrderEventsPublisher,
  ) {}

  async execute(dto: UpdateOrderStatusDto): Promise<OrderResponseDto> {
    // 1. Buscar pedido
    const order = await this.orderRepository.findById(dto.orderId);
    if (!order) {
      throw new NotFoundException(`Order with id ${dto.orderId} not found`);
    }

    // 2. Validar status
    if (
      !Object.values(OrderStatusEnum).includes(dto.newStatus as OrderStatusEnum)
    ) {
      throw new BadRequestException(`Invalid status: ${dto.newStatus}`);
    }

    // 3. Atualizar status (validação de transição acontece no agregado)
    try {
      const newStatusVO = OrderStatus.create(dto.newStatus as OrderStatusEnum);
      order.updateStatus(newStatusVO);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    // 4. Persistir
    const updatedOrder = await this.orderRepository.update(order);

    // 5. Processar eventos de domínio
    const events = updatedOrder.getUncommittedEvents();
    for (const event of events) {
      if (event.eventName === 'OrderStatusChanged') {
        const statusEvent = event as OrderStatusChangedEvent;
        // Publicar evento no RabbitMQ com Protobuf (assíncrono)
        await this.orderEventsPublisher.publishOrderStatusChanged({
          orderId: updatedOrder.id,
          customerId: updatedOrder.customerId,
          previousStatus: statusEvent.payload.previousStatus,
          newStatus: updatedOrder.status.value,
          changedAt: new Date().toISOString(),
        });

        // Manter notificação síncrona (fallback)
        await this.notificationSender.sendOrderStatusChangedNotification(
          updatedOrder.id,
          updatedOrder.status.value,
        );
      } else if (event.eventName === 'OrderCancelled') {
        const cancelEvent = event as OrderCancelledEvent;
        // Publicar evento de cancelamento no RabbitMQ com Protobuf
        await this.orderEventsPublisher.publishOrderCancelled({
          orderId: updatedOrder.id,
          customerId: updatedOrder.customerId,
          reason: cancelEvent.payload.reason || 'No reason provided',
          cancelledAt: new Date().toISOString(),
        });

        // Manter notificação síncrona (fallback)
        await this.notificationSender.sendOrderCancelledNotification(
          updatedOrder.id,
        );
      }
    }
    updatedOrder.clearEvents();

    // 6. Retornar DTO
    return this.toResponseDto(updatedOrder);
  }

  private toResponseDto(order: any): OrderResponseDto {
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
