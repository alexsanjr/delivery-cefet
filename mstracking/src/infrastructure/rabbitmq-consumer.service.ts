import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { StartTrackingUseCase } from '../application/use-cases/start-tracking.use-case';

@Injectable()
export class RabbitMQConsumerService implements OnApplicationBootstrap {
    private readonly logger = new Logger(RabbitMQConsumerService.name);

    constructor(
        private readonly rabbitmqService: RabbitMQService,
        private readonly startTrackingUseCase: StartTrackingUseCase,
    ) {}

    async onApplicationBootstrap() {
        this.logger.log('RabbitMQConsumerService initialized (no auto-consumption)');
    }

    private async startConsuming(): Promise<void> {
        this.logger.log('RabbitMQ auto-consumption disabled for tracking service');
    }

    private async processOrderEvent(message: any): Promise<void> {
        try {
            this.logger.log(`Processing order event: ${message.order_id} for delivery ${message.delivery_id}`);

            await this.startTrackingUseCase.execute({
                deliveryId: message.delivery_id,
                orderId: message.order_id,
                latitude: 0,
                longitude: 0,
                deliveryPersonId: message.delivery_person_id || 'unknown',
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
