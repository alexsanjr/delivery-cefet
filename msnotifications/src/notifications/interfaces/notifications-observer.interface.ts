import { NotificationData } from './notifications-data.interface';

export interface INotificationObserver {
    update(notification: NotificationData): Promise<void>;
}