import type { NotificationEntity } from '../notification.entity';

export interface MessagingPort {
    publishNotification(notification: NotificationEntity): Promise<void>;
}
