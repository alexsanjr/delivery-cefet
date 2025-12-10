import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { ProtobufService } from '../protobuf.service';
import {
  OrderCreatedMessageData,
  OrderStatusChangedMessageData,
  OrderCancelledMessageData,
} from './order.events';
import * as protobuf from 'protobufjs';

@Injectable()
export class OrderEventsPublisher implements OnModuleInit {
  private readonly logger = new Logger(OrderEventsPublisher.name);
  private protoRoot: protobuf.Root;

  // Exchanges e Routing Keys
  private readonly ORDERS_EXCHANGE = 'orders.events';
  private readonly ORDER_CREATED_KEY = 'order.created';
  private readonly ORDER_STATUS_CHANGED_KEY = 'order.status.changed';
  private readonly ORDER_CANCELLED_KEY = 'order.cancelled';

  constructor(
    private readonly rabbitMQ: RabbitMQService,
    private readonly protobuf: ProtobufService,
  ) {}

  async onModuleInit() {
    // Carrega o arquivo proto
    this.protoRoot = await this.protobuf.loadProto('order-events.proto');
    this.logger.log('Order Events Publisher initialized');
  }

  /**
   * Publica evento de pedido criado
   */
  async publishOrderCreated(data: OrderCreatedMessageData): Promise<void> {
    try {
      // Serializa com Protobuf
      const buffer = this.protobuf.serialize(
        this.protoRoot,
        'orders.events.OrderCreatedEvent',
        {
          order_id: data.orderId,
          customer_id: data.customerId,
          total: data.total,
          status: data.status,
          payment_method: data.paymentMethod,
          items: data.items.map((item) => ({
            product_id: item.productId,
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
          })),
          created_at: data.createdAt,
        },
      );

      // Publica no RabbitMQ
      await this.rabbitMQ.publishProtobuf(
        this.ORDERS_EXCHANGE,
        this.ORDER_CREATED_KEY,
        buffer,
      );

      this.logger.log(`Published OrderCreated event for order ${data.orderId}`);
    } catch (error) {
      this.logger.error('Failed to publish OrderCreated event', error);
      throw error;
    }
  }

  /**
   * Publica evento de mudança de status
   */
  async publishOrderStatusChanged(
    data: OrderStatusChangedMessageData,
  ): Promise<void> {
    try {
      const buffer = this.protobuf.serialize(
        this.protoRoot,
        'orders.events.OrderStatusChangedEvent',
        {
          order_id: data.orderId,
          customer_id: data.customerId,
          previous_status: data.previousStatus,
          new_status: data.newStatus,
          changed_at: data.changedAt,
        },
      );

      await this.rabbitMQ.publishProtobuf(
        this.ORDERS_EXCHANGE,
        this.ORDER_STATUS_CHANGED_KEY,
        buffer,
      );

      this.logger.log(
        `Published OrderStatusChanged event for order ${data.orderId} (${data.previousStatus} → ${data.newStatus})`,
      );
    } catch (error) {
      this.logger.error('Failed to publish OrderStatusChanged event', error);
      throw error;
    }
  }

  /**
   * Publica evento de cancelamento
   */
  async publishOrderCancelled(data: OrderCancelledMessageData): Promise<void> {
    try {
      const buffer = this.protobuf.serialize(
        this.protoRoot,
        'orders.events.OrderCancelledEvent',
        {
          order_id: data.orderId,
          customer_id: data.customerId,
          reason: data.reason || '',
          cancelled_at: data.cancelledAt,
        },
      );

      await this.rabbitMQ.publishProtobuf(
        this.ORDERS_EXCHANGE,
        this.ORDER_CANCELLED_KEY,
        buffer,
      );

      this.logger.log(
        `Published OrderCancelled event for order ${data.orderId}`,
      );
    } catch (error) {
      this.logger.error('Failed to publish OrderCancelled event', error);
      throw error;
    }
  }
}
