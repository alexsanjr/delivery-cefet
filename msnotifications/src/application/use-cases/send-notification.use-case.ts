import { Injectable, Inject } from '@nestjs/common';
import type { NotificationRepositoryPort } from '../../domain/ports/notification-repository.port';
import type { NotificationSubjectPort } from '../../domain/ports/notification-observer.port';
import type { MessagingPort } from '../../domain/ports/messaging.port';
import { CreateNotificationCommand } from '../commands/create-notification.command';
import { NotificationEntity } from '../../domain/notification.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { OrderId } from '../../domain/value-objects/order-id.vo';
import { NotificationStatus } from '../../domain/value-objects/notification-status.vo';
import { ServiceOrigin } from '../../domain/value-objects/service-origin.vo';
import type { NotificationData } from '../../domain/notification-data.interface';

@Injectable()
export class SendNotificationUseCase {
    constructor(
        @Inject('NotificationRepositoryPort') private readonly notificationRepository: NotificationRepositoryPort,
        @Inject('NotificationSubjectPort') private readonly notificationSubject: NotificationSubjectPort,
        @Inject('MessagingPort') private readonly messagingService: MessagingPort,
    ) {}

    async execute(command: CreateNotificationCommand): Promise<NotificationEntity> {
        const userId = UserId.create(command.userId);
        const orderId = OrderId.create(command.orderId);
        const status = NotificationStatus.create(command.status);
        const serviceOrigin = ServiceOrigin.create(command.serviceOrigin);
        const message = command.message || this.generateMessage(status.getValue(), orderId.getValue());

        const notification = NotificationEntity.create(
            userId,
            orderId,
            status,
            message,
            serviceOrigin,
        );

        await this.notificationRepository.save(notification);

        const notificationData: NotificationData = {
            orderId: notification.getOrderId().getValue(),
            userId: notification.getUserId().getValue(),
            status: notification.getStatus().getValue(),
            message: notification.getMessage(),
            serviceOrigin: notification.getServiceOrigin().getValue(),
        };
        await this.notificationSubject.notify(notificationData);
        await this.messagingService.publishNotification(notification);

        return notification;
    }

    private generateMessage(status: string, orderId: string): string {
        switch (status) {
            case 'CONFIRMED':
                return `Pedido #${orderId} confirmado! Preparando para envio.`;
            case 'PREPARING':
                return `Pedido #${orderId} esta sendo preparado na cozinha.`;
            case 'OUT_FOR_DELIVERY':
                return `Pedido #${orderId} saiu para entrega!`;
            case 'DELIVERED':
                return `Pedido #${orderId} foi entregue com sucesso!`;
            case 'CANCELLED':
                return `Pedido #${orderId} foi cancelado.`;
            default:
                return `Status do pedido #${orderId}: ${status}`;
        }
    }
}