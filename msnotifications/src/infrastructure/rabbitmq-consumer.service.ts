import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService, RabbitMQMessage } from './rabbitmq.service';
import { NotificationSubjectAdapter } from './adapters/notification-subject.adapter';
import type { NotificationData } from '../domain/interfaces/notification-data.interface';

@Injectable()
export class RabbitMQConsumerService implements OnModuleInit {
    private readonly logger = new Logger(RabbitMQConsumerService.name);

    constructor(
        private readonly rabbitmqService: RabbitMQService,
        private readonly notificationSubject: NotificationSubjectAdapter,
    ) {}

    async onModuleInit() {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.startConsuming();
    }

    private async startConsuming(): Promise<void> {
        this.logger.log('Starting RabbitMQ consumer for notifications...');

        await this.rabbitmqService.consumeNotifications(async (message: RabbitMQMessage) => {
            await this.processNotification(message);
        });

        this.logger.log('RabbitMQ consumer started successfully');
    }

    private async processNotification(message: RabbitMQMessage): Promise<void> {
        try {
            this.logger.log(
                `Processing notification from RabbitMQ: ${message.id} ` +
                `(Order: ${message.orderId}, User: ${message.userId}, Status: ${message.status})`
            );

            const notificationData: NotificationData = {
                orderId: message.orderId,
                userId: message.userId,
                status: message.status,
                message: message.message,
                serviceOrigin: message.serviceOrigin,
            };

            await this.notificationSubject.notify(notificationData);

            this.logger.log(`Successfully processed notification: ${message.id}`);
        } catch (error) {
            this.logger.error(`Failed to process notification: ${message.id}`, error);
            throw error;
        }
    }
}
