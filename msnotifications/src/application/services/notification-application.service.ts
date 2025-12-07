import { Injectable } from '@nestjs/common';
import type { CreateNotificationDto } from '../dtos/notifications-create.dto';
import type { NotificationEntity } from '../../domain/notification.entity';
import { SendNotificationUseCase } from '../use-cases/send-notification.use-case';
import { GetNotificationsUseCase } from '../use-cases/get-notifications.use-case';
import { MarkNotificationAsReadUseCase } from '../use-cases/mark-notification-read.use-case';
import { ManageClientConnectionUseCase } from '../use-cases/manage-client-connection.use-case';

@Injectable()
export class NotificationApplicationService {
    constructor(
        private readonly sendNotificationUseCase: SendNotificationUseCase,
        private readonly getNotificationsUseCase: GetNotificationsUseCase,
        private readonly markNotificationAsReadUseCase: MarkNotificationAsReadUseCase,
        private readonly manageClientConnectionUseCase: ManageClientConnectionUseCase,
    ) {}

    async sendNotification(createDto: CreateNotificationDto): Promise<NotificationEntity> {
        return await this.sendNotificationUseCase.execute(createDto);
    }

    async getNotificationsByUserId(userId: string): Promise<NotificationEntity[]> {
        return await this.getNotificationsUseCase.getByUserId(userId);
    }

    async getNotificationsByOrderId(orderId: string): Promise<NotificationEntity[]> {
        return await this.getNotificationsUseCase.getByOrderId(orderId);
    }

    async markNotificationAsRead(notificationId: string): Promise<void> {
        await this.markNotificationAsReadUseCase.execute(notificationId);
    }

    connectClient(userId: string): void {
        this.manageClientConnectionUseCase.connectClient(userId);
    }

    disconnectClient(userId: string): void {
        this.manageClientConnectionUseCase.disconnectClient(userId);
    }

    getConnectedClients(): string[] {
        return this.manageClientConnectionUseCase.getConnectedClients();
    }
}