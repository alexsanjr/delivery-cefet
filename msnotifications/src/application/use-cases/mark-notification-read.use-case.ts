import { Injectable, Inject } from '@nestjs/common';
import type { NotificationRepositoryPort } from '../../domain/ports/notification-repository.port';
import { MarkAsReadCommand } from '../commands/mark-as-read.command';
import { NotificationId } from '../../domain/value-objects/notification-id.vo';

@Injectable()
export class MarkNotificationAsReadUseCase {
    constructor(
        @Inject('NotificationRepositoryPort') private readonly notificationRepository: NotificationRepositoryPort,
    ) {}

    async execute(command: MarkAsReadCommand): Promise<void> {
        const notificationId = NotificationId.from(command.notificationId);
        const notification = await this.notificationRepository.findById(notificationId);
        
        if (!notification) {
            throw new Error(`Notification ${command.notificationId} not found`);
        }

        notification.markAsRead();
        await this.notificationRepository.update(notification);
    }
}