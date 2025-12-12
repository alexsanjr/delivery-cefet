import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { Order } from '../../../domain/aggregates/order/order.aggregate';
import { OrderItem } from '../../../domain/entities/order-item.entity';
import { Money } from '../../../domain/value-objects/money.vo';
import { Address } from '../../../domain/value-objects/address.vo';
import { PaymentMethod } from '../../../domain/value-objects/payment-method.vo';
import { DeliveryFeeCalculator } from '../../../domain/services/delivery-fee-calculator.service';
import type { IOrderRepository } from '../../../domain/repositories/order.repository.interface';
import { ORDER_REPOSITORY } from '../../../domain/repositories/order.repository.interface';
import type { ICustomerValidator } from '../../ports/customer-validator.port';
import { CUSTOMER_VALIDATOR } from '../../ports/customer-validator.port';
import type { INotificationSender } from '../../ports/notification-sender.port';
import { NOTIFICATION_SENDER } from '../../ports/notification-sender.port';
import type { IRoutingCalculator } from '../../ports/routing-calculator.port';
import { ROUTING_CALCULATOR } from '../../ports/routing-calculator.port';
import { CreateOrderDto } from '../../dto/create-order.dto';
import { OrderResponseDto } from '../../dto/order-response.dto';
import { OrderEventsPublisher } from '../../../rabbitmq/events/order-events.publisher';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,

    @Inject(CUSTOMER_VALIDATOR)
    private readonly customerValidator: ICustomerValidator,

    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: INotificationSender,

    @Inject(ROUTING_CALCULATOR)
    private readonly routingCalculator: IRoutingCalculator,

    private readonly deliveryFeeCalculator: DeliveryFeeCalculator,

    private readonly orderEventsPublisher: OrderEventsPublisher,
  ) {}

  async execute(dto: CreateOrderDto): Promise<OrderResponseDto> {
    // 1. Validar se o cliente existe
    const customerExists = await this.customerValidator.exists(dto.customerId);
    if (!customerExists) {
      throw new BadRequestException(
        `Customer with id ${dto.customerId} not found`,
      );
    }

    // 2. Criar value objects
    const address = Address.create({
      street: dto.deliveryAddress.street,
      number: dto.deliveryAddress.number,
      neighborhood: dto.deliveryAddress.neighborhood,
      city: dto.deliveryAddress.city,
      state: dto.deliveryAddress.state,
      zipCode: dto.deliveryAddress.zipCode,
      complement: dto.deliveryAddress.complement,
      latitude: dto.deliveryAddress.latitude,
      longitude: dto.deliveryAddress.longitude,
    });

    const paymentMethod = PaymentMethod.create(dto.paymentMethod);

    // 3. Calcular taxa de entrega usando Domain Service
    let deliveryFeeMoney: Money;

    if (dto.deliveryFee !== undefined) {
      deliveryFeeMoney = Money.create(dto.deliveryFee, 'BRL');
    } else {
      // Usar Domain Service para calcular taxa
      deliveryFeeMoney = this.deliveryFeeCalculator.calculateByAddress(address);
    }

    // 4. Criar OrderItems
    const orderItems = dto.items.map((item) =>
      OrderItem.create({
        productId: item.productId,
        productName: item.productName,
        description: item.description,
        quantity: item.quantity,
        unitPrice: Money.create(item.unitPrice, 'BRL'),
      }),
    );

    // 5. Criar agregado Order
    const order = Order.create({
      customerId: dto.customerId,
      items: orderItems,
      deliveryAddress: address,
      paymentMethod,
      deliveryFee: deliveryFeeMoney,
    });

    // 6. Persistir
    const savedOrder = await this.orderRepository.save(order);

    // 7. Processar eventos de domínio
    const events = savedOrder.getUncommittedEvents();
    for (const event of events) {
      if (event.eventName === 'OrderCreated') {
        // Publicar evento no RabbitMQ com Protobuf (assíncrono)
        await this.orderEventsPublisher.publishOrderCreated({
          orderId: savedOrder.id,
          customerId: savedOrder.customerId,
          total: savedOrder.total.amount,
          status: savedOrder.status.value,
          paymentMethod: savedOrder.paymentMethod.value,
          items: savedOrder.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice.amount,
            subtotal: item.subtotal.amount,
          })),
          createdAt: savedOrder.createdAt.toISOString(),
        });

        // Manter notificação síncrona (fallback)
        await this.notificationSender.sendOrderCreatedNotification(
          savedOrder.id,
          savedOrder.customerId,
        );
      }
    }
    savedOrder.clearEvents();

    // 8. Retornar DTO de resposta
    return this.toResponseDto(savedOrder);
  }

  private toResponseDto(order: Order): OrderResponseDto {
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
