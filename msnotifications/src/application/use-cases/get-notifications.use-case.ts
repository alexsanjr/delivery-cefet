import { Injectable, Inject } from '@nestjs/common';
import type { NotificationRepositoryPort } from '../../domain/ports/notification-repository.port';
import type { NotificationEntity } from '../../domain/notification.entity';

@Injectable()
export class GetNotificationsUseCase {
    constructor(
        @Inject('NotificationRepositoryPort') private readonly notificationRepository: NotificationRepositoryPort,
    ) {}

    async getByUserId(userId: string): Promise<NotificationEntity[]> {
        return await this.notificationRepository.findByUserId(userId);
    }

    async getByOrderId(orderId: string): Promise<NotificationEntity[]> {
        return await this.notificationRepository.findByOrderId(orderId);
    }
}