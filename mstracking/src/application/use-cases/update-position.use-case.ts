import { Injectable, Inject } from '@nestjs/common';
import { TrackingPosition } from '../../domain/tracking-position.entity';
import { TypeORMTrackingRepository } from '../../infrastructure/persistence/typeorm-tracking.repository';
import { TypeORMDeliveryTrackingRepository } from '../../infrastructure/persistence/typeorm-delivery-tracking.repository';
import { PositionSubjectAdapter } from '../../infrastructure/adapters/position-subject.adapter';
import { RabbitMQService } from '../../infrastructure/rabbitmq.service';
import { NotificationFactory } from '../../domain/notifications/notification.factory';

export interface UpdatePositionInput {
    deliveryId: string;
    latitude: number;
    longitude: number;
    deliveryPersonId: string;
}

@Injectable()
export class UpdatePositionUseCase {
    constructor(
        private readonly trackingRepository: TypeORMTrackingRepository,
        private readonly deliveryTrackingRepository: TypeORMDeliveryTrackingRepository,
        private readonly positionSubject: PositionSubjectAdapter,
        private readonly messaging: RabbitMQService,
        @Inject('EMAIL_NOTIFICATION_FACTORY')
        private readonly emailNotificationFactory: NotificationFactory,
        @Inject('SMS_NOTIFICATION_FACTORY')
        private readonly smsNotificationFactory: NotificationFactory,
    ) {}

    async execute(input: UpdatePositionInput): Promise<TrackingPosition> {
        const existingPosition = await this.trackingRepository.findLatestByDeliveryId(input.deliveryId);
        if (!existingPosition) {
            throw new Error(`Tracking not found for delivery_id: ${input.deliveryId}`);
        }

        const deliveryTracking = await this.deliveryTrackingRepository.findByDeliveryId(input.deliveryId);
        if (deliveryTracking?.isDelivered()) {
            throw new Error(`Cannot update position: delivery ${input.deliveryId} is already completed`);
        }

        const position = new TrackingPosition(
            crypto.randomUUID(),
            input.deliveryId,
            existingPosition.orderId,
            input.latitude,
            input.longitude,
            input.deliveryPersonId,
            new Date(),
            'active',
        );

        const savedPosition = await this.trackingRepository.save(position);

        this.positionSubject.notify(savedPosition);

        await this.messaging.publishPositionUpdate({
            deliveryId: savedPosition.deliveryId,
            orderId: savedPosition.orderId,
            latitude: savedPosition.latitude,
            longitude: savedPosition.longitude,
            deliveryPersonId: savedPosition.deliveryPersonId,
            timestamp: savedPosition.timestamp,
        });

        // Factory Method Pattern: Usa factory para criar e enviar notificações
        // A escolha da factory (email ou SMS) determina o tipo de notificação
        try {
            const message = `Sua entrega está a caminho! Localização atualizada: ${input.latitude.toFixed(4)}, ${input.longitude.toFixed(4)}`;
            
            // Usa EmailNotificationFactory para criar e enviar email
            await this.emailNotificationFactory.sendNotification(
                'customer@example.com', // Em produção, buscar do pedido
                message,
                savedPosition.deliveryId,
                savedPosition.orderId
            );

            // Usa SmsNotificationFactory para criar e enviar SMS
            await this.smsNotificationFactory.sendNotification(
                '+5511999999999', // Em produção, buscar do pedido
                message,
                savedPosition.deliveryId,
                savedPosition.orderId
            );
        } catch (error) {
            // Log erro mas não falha a operação principal
            console.error('Erro ao enviar notificações:', error);
        }

        return savedPosition;
    }
}
