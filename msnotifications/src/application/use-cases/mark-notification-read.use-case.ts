import { Injectable } from '@nestjs/common';
import type { NotificationRepositoryPort } from '../../domain/ports/notification-repository.port';

@Injectable()
export class MarkNotificationAsReadUseCase {
    constructor(
        private readonly notificationRepository: NotificationRepositoryPort,
    ) {}

    async execute(notificationId: string): Promise<void> {
        await this.notificationRepository.markAsRead(notificationId);
    }
}