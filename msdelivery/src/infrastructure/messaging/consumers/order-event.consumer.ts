import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../services/rabbitmq.service';
import { QUEUE_NAMES } from '../constants/queue.constants';

export interface OrderCreatedEventDto {
  orderId: number;
  customerId: number;
  total: number;
  status: string;
  paymentMethod: string;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: string;
}

export type OrderEventHandler<T> = (event: T) => Promise<void>;

@Injectable()
export class OrderEventConsumer implements OnModuleInit {
  private readonly logger = new Logger(OrderEventConsumer.name);

  private orderCreatedHandler?: OrderEventHandler<OrderCreatedEventDto>;

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async onModuleInit(): Promise<void> {
    // Delay to ensure RabbitMQ is connected
    setTimeout(() => this.setupConsumers(), 2000);
  }

  private async setupConsumers(): Promise<void> {
    try {
      // Consume OrderCreatedEvent
      await this.rabbitMQService.consume<{
        order_id: number;
        customer_id: number;
        total: number;
        status: string;
        payment_method: string;
        items: Array<{
          product_id: number;
          product_name: string;
          quantity: number;
          unit_price: number;
        }>;
        created_at: string;
      }>(
        QUEUE_NAMES.CREATE_DELIVERY_COMMAND,
        'orders.events.OrderCreatedEvent',
        async (data) => {
          const event: OrderCreatedEventDto = {
            orderId: data.order_id,
            customerId: data.customer_id,
            total: data.total,
            status: data.status,
            paymentMethod: data.payment_method,
            items: data.items.map(item => ({
              productId: item.product_id,
              productName: item.product_name,
              quantity: item.quantity,
              unitPrice: item.unit_price,
            })),
            createdAt: data.created_at,
          };

          this.logger.log(`Received OrderCreatedEvent for order ${event.orderId}`);
          
          if (this.orderCreatedHandler) {
            await this.orderCreatedHandler(event);
          }
        },
      );

      this.logger.log('Order event consumers initialized');
    } catch (error) {
      this.logger.error('Failed to setup order event consumers:', error);
      throw error;
    }
  }

  onOrderCreated(handler: OrderEventHandler<OrderCreatedEventDto>): void {
    this.orderCreatedHandler = handler;
  }
}
