import { NotificationEntity } from '../notification.entity';
import { UserId } from '../value-objects/user-id.vo';
import { OrderId } from '../value-objects/order-id.vo';
import { NotificationId } from '../value-objects/notification-id.vo';

export interface NotificationRepositoryPort {
    save(notification: NotificationEntity): Promise<void>;
    findById(id: NotificationId): Promise<NotificationEntity | null>;
    findByUserId(userId: UserId): Promise<NotificationEntity[]>;
    findByOrderId(orderId: OrderId): Promise<NotificationEntity[]>;
    update(notification: NotificationEntity): Promise<void>;
}