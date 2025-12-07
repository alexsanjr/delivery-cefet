import { NotificationEntity } from '../notification.entity';
import { CreateNotificationDto } from '../../application/dtos/notifications-create.dto';

export interface NotificationRepositoryPort {
    create(createNotificationDto: CreateNotificationDto & { message: string }): Promise<NotificationEntity>;
    findByUserId(userId: string): Promise<NotificationEntity[]>;
    findByOrderId(orderId: string): Promise<NotificationEntity[]>;
    markAsRead(notificationId: string): Promise<void>;
}