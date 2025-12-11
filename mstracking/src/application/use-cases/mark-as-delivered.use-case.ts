import { Injectable } from '@nestjs/common';
import { TypeORMDeliveryTrackingRepository } from '../../infrastructure/persistence/typeorm-delivery-tracking.repository';
import { RabbitMQService } from '../../infrastructure/rabbitmq.service';
import { NotificationsGrpcAdapter } from '../../infrastructure/adapters/notifications-grpc.adapter';

@Injectable()
export class MarkAsDeliveredUseCase {
    constructor(
        private readonly deliveryTrackingRepository: TypeORMDeliveryTrackingRepository,
        private readonly messaging: RabbitMQService,
        private readonly notificationService: NotificationsGrpcAdapter,
    ) {}

    async execute(orderId: string, deliveryId: string): Promise<void> {
        const deliveryTracking = await this.deliveryTrackingRepository.findByDeliveryId(deliveryId);
        if (!deliveryTracking) {
            throw new Error(`Delivery tracking not found: ${deliveryId}`);
        }

        if (deliveryTracking.orderId !== orderId) {
            throw new Error(`Delivery ${deliveryId} does not belong to order ${orderId}`);
        }

        deliveryTracking.markAsDelivered();
        await this.deliveryTrackingRepository.update(deliveryTracking);

        await this.messaging.publishDeliveryCompleted({
            deliveryId: deliveryTracking.deliveryId,
            orderId: deliveryTracking.orderId,
            completedAt: deliveryTracking.completedAt!,
        });

        try {
            const userId = `order-${orderId}`;
            await this.notificationService.notifyDelivered(userId, orderId);
        } catch (error) {
            console.error('Failed to send delivered notification:', error);
        }
    }
}
