import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { OrderEventsHandler } from '../../presentation/messaging/order-events.handler';

@Injectable()
export class RabbitMQConsumerService implements OnModuleInit {
    private readonly logger = new Logger(RabbitMQConsumerService.name);

    constructor(
        private readonly rabbitmqService: RabbitMQService,
        private readonly orderEventsHandler: OrderEventsHandler,
    ) {}

    async onModuleInit() {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.startConsuming();
    }

    private async startConsuming(): Promise<void> {
        this.logger.log('Starting RabbitMQ consumer for order events...');

        await this.rabbitmqService.consumeOrderEvents(async (event: any, routingKey: string) => {
            await this.processOrderEvent(event, routingKey);
        });

        this.logger.log('RabbitMQ consumer started');
    }

    private async processOrderEvent(event: any, routingKey: string): Promise<void> {
        try {
            this.logger.debug(
                `Processing order event from RabbitMQ - Routing Key: ${routingKey}, ` +
                `Order ID: ${event.orderId}`
            );

            // Route event to appropriate handler
            if (routingKey === 'order.created') {
                await this.orderEventsHandler.handleOrderCreated(event);
            } else if (routingKey === 'order.status.changed') {
                await this.orderEventsHandler.handleOrderStatusChanged(event);
            } else if (routingKey === 'order.cancelled') {
                await this.orderEventsHandler.handleOrderCancelled(event);
            } else if (routingKey === 'order.notification') {
                await this.orderEventsHandler.handleNotification(event);
            } else {
                this.logger.warn(`Unknown routing key: ${routingKey}`);
            }

            this.logger.debug(`Successfully processed order event: ${routingKey}`);
        } catch (error) {
            this.logger.error(`Failed to process order event: ${routingKey}`, error);
            throw error;
        }
    }
}
