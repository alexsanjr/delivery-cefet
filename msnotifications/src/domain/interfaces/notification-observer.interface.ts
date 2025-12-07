import { NotificationData } from './notification-data.interface';

export interface INotificationObserver {
    update(notification: NotificationData): Promise<void>;
}

export interface INotificationSubject {
    subscribe(observer: INotificationObserver): void;
    unsubscribe(observer: INotificationObserver): void;
    notify(notification: NotificationData): Promise<void>;
}

export interface IConnectedClient {
    userId: string;
    connectedAt: Date;
}