import { Injectable, Inject } from '@nestjs/common';
import type { NotificationRepositoryPort } from '../../domain/ports/notification-repository.port';
import type { NotificationSubjectPort } from '../../domain/ports/notification-observer.port';
import type { MessagingPort } from '../../domain/ports/messaging.port';
import type { CreateNotificationDto } from '../dtos/notifications-create.dto';
import type { NotificationEntity } from '../../domain/notification.entity';
import type { NotificationData } from '../../domain/interfaces/notification-data.interface';

@Injectable()
export class SendNotificationUseCase {
    constructor(
        @Inject('NotificationRepositoryPort') private readonly notificationRepository: NotificationRepositoryPort,
        @Inject('NotificationSubjectPort') private readonly notificationSubject: NotificationSubjectPort,
        @Inject('MessagingPort') private readonly messagingService: MessagingPort,
    ) {}

    async execute(createDto: CreateNotificationDto): Promise<NotificationEntity> {
        const message = createDto.message || this.generateMessage(createDto.status, createDto.orderId);
        const notification = await this.notificationRepository.create({
            ...createDto,
            message,
        });

        const notificationData: NotificationData = {
            orderId: notification.orderId,
            userId: notification.userId,
            status: notification.status,
            message: notification.message,
            serviceOrigin: notification.serviceOrigin,
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