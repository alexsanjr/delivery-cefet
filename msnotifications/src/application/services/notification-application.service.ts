import { Injectable } from '@nestjs/common';
import { NotificationEntity } from '../../domain/notification.entity';
import { SendNotificationUseCase } from '../use-cases/send-notification.use-case';
import { GetNotificationsUseCase } from '../use-cases/get-notifications.use-case';
import { MarkNotificationAsReadUseCase } from '../use-cases/mark-notification-read.use-case';
import { ManageClientConnectionUseCase } from '../use-cases/manage-client-connection.use-case';
import { CreateNotificationCommand } from '../commands/create-notification.command';
import { GetNotificationsByUserQuery } from '../queries/get-notifications-by-user.query';
import { GetNotificationsByOrderQuery } from '../queries/get-notifications-by-order.query';
import { MarkAsReadCommand } from '../commands/mark-as-read.command';

@Injectable()
export class NotificationApplicationService {
    constructor(
        private readonly sendNotificationUseCase: SendNotificationUseCase,
        private readonly getNotificationsUseCase: GetNotificationsUseCase,
        private readonly markNotificationAsReadUseCase: MarkNotificationAsReadUseCase,
        private readonly manageClientConnectionUseCase: ManageClientConnectionUseCase,
    ) {}

    async sendNotification(userId: string, orderId: string, status: string, serviceOrigin: string, message?: string): Promise<NotificationEntity> {
        const command = new CreateNotificationCommand(userId, orderId, status, serviceOrigin, message);
        return await this.sendNotificationUseCase.execute(command);
    }

    async getNotificationsByUserId(userId: string): Promise<NotificationEntity[]> {
        const query = new GetNotificationsByUserQuery(userId);
        return await this.getNotificationsUseCase.getByUserId(query);
    }

    async getNotificationsByOrderId(orderId: string): Promise<NotificationEntity[]> {
        const query = new GetNotificationsByOrderQuery(orderId);
        return await this.getNotificationsUseCase.getByOrderId(query);
    }

    async markNotificationAsRead(notificationId: string): Promise<void> {
        const command = new MarkAsReadCommand(notificationId);
        await this.markNotificationAsReadUseCase.execute(command);
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