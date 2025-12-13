import { Injectable, Inject } from '@nestjs/common';
import type { NotificationRepositoryPort } from '../../domain/ports/notification-repository.port';
import { NotificationEntity } from '../../domain/notification.entity';
import { GetNotificationsByUserQuery } from '../queries/get-notifications-by-user.query';
import { GetNotificationsByOrderQuery } from '../queries/get-notifications-by-order.query';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { OrderId } from '../../domain/value-objects/order-id.vo';

@Injectable()
export class GetNotificationsUseCase {
    constructor(
        @Inject('NotificationRepositoryPort') private readonly notificationRepository: NotificationRepositoryPort,
    ) {}

    async getByUserId(query: GetNotificationsByUserQuery): Promise<NotificationEntity[]> {
        const userId = UserId.create(query.userId);
        return await this.notificationRepository.findByUserId(userId);
    }

    async getByOrderId(query: GetNotificationsByOrderQuery): Promise<NotificationEntity[]> {
        const orderId = OrderId.create(query.orderId);
        return await this.notificationRepository.findByOrderId(orderId);
    }
}