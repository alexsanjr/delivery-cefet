import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OrderEventConsumer, OrderCreatedEventDto } from '../../infrastructure/messaging/consumers/order-event.consumer';
import { DeliveryApplicationService } from './delivery-application.service';

@Injectable()
export class OrderEventHandlerService implements OnModuleInit {
  private readonly logger = new Logger(OrderEventHandlerService.name);

  constructor(
    private readonly orderEventConsumer: OrderEventConsumer,
    private readonly deliveryService: DeliveryApplicationService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.orderEventConsumer.onOrderCreated(this.handleOrderCreated.bind(this));
    this.logger.log('Order event handlers registered');
  }

  private async handleOrderCreated(event: OrderCreatedEventDto): Promise<void> {
    try {
      this.logger.log(`Processing OrderCreatedEvent for order ${event.orderId}`);

      // For now, create delivery with placeholder coordinates
      // In production, these should come from the order or be geocoded from address
      const delivery = await this.deliveryService.create({
        orderId: event.orderId,
        customerLatitude: -19.917299, // Placeholder: Belo Horizonte center
        customerLongitude: -43.934559,
        customerAddress: 'Endereço do cliente', // Should come from orders service
      });

      this.logger.log(`Delivery created successfully: ID ${delivery.id} for order ${event.orderId}`);
    } catch (error) {
      this.logger.error(`Failed to create delivery for order ${event.orderId}:`, error);
      throw error;
    }
  }
}
