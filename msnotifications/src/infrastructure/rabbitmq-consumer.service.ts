import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { OrderEventsAdapter } from './adapters/order-events.adapter';

@Injectable()
export class RabbitMQConsumerService implements OnApplicationBootstrap {
    private readonly logger = new Logger(RabbitMQConsumerService.name);

    constructor(
        private readonly rabbitmqService: RabbitMQService,
        private readonly orderEventsAdapter: OrderEventsAdapter,
    ) {}

    async onModuleInit() {
        this.logger.log('RabbitMQConsumerService initializing - waiting 2s for RabbitMQ...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.startConsuming();
    }

    private async startConsuming(): Promise<void> {
        this.logger.log('Starting RabbitMQ consumer for order events...');

        await this.rabbitmqService.consumeOrderEvents(async (event: any, routingKey: string) => {
            await this.processOrderEvent(event, routingKey);
        });

        this.logger.log('RabbitMQ consumer started successfully - listening to orders.events exchange');
    }

    private async processOrderEvent(event: any, routingKey: string): Promise<void> {
        try {
            this.logger.log(
                `Processing order event from RabbitMQ - Routing Key: ${routingKey}, ` +
                `Order ID: ${event.orderId}`
            );

            // Route event to appropriate adapter handler
            if (routingKey === 'order.created') {
                await this.orderEventsAdapter.handleOrderCreated(event);
            } else if (routingKey === 'order.status.changed') {
                await this.orderEventsAdapter.handleOrderStatusChanged(event);
            } else if (routingKey === 'order.cancelled') {
                await this.orderEventsAdapter.handleOrderCancelled(event);
            } else {
                this.logger.warn(`Unknown routing key: ${routingKey}`);
            }

            this.logger.log(`Successfully processed order event: ${routingKey}`);
        } catch (error) {
            this.logger.error(`Failed to process order event: ${routingKey}`, error);
            throw error;
        }
    }
}
