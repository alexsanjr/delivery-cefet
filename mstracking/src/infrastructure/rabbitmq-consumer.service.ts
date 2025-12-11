import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { StartTrackingUseCase } from '../application/use-cases/start-tracking.use-case';

@Injectable()
export class RabbitMQConsumerService implements OnModuleInit {
    private readonly logger = new Logger(RabbitMQConsumerService.name);

    constructor(
        private readonly rabbitmqService: RabbitMQService,
        private readonly startTrackingUseCase: StartTrackingUseCase,
    ) {}

    async onModuleInit() {
        await this.startConsuming();
    }

    private async startConsuming(): Promise<void> {
        this.logger.log('Starting RabbitMQ consumer for tracking events...');

        await this.rabbitmqService.consumeOrderEvents(async (message) => {
            await this.processOrderEvent(message);
        });

        this.logger.log('RabbitMQ consumer started successfully');
    }

    private async processOrderEvent(message: any): Promise<void> {
        try {
            this.logger.log(`Processing order event: ${message.order_id} for delivery ${message.delivery_id}`);

            await this.startTrackingUseCase.execute({
                deliveryId: message.delivery_id,
                orderId: message.order_id,
                originLat: 0,
                originLng: 0,
                destinationLat: message.destination_lat,
                destinationLng: message.destination_lng,
            });

            this.logger.log(`Successfully started tracking for order: ${message.order_id}`);
        } catch (error) {
            this.logger.error(`Failed to process order event: ${message.order_id}`, error);
            throw error;
        }
    }
}
