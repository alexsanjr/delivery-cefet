import { NotificationData } from '../notification-data.interface';

export interface NotificationObserverPort {
    update(notification: NotificationData): Promise<void>;
}

export interface NotificationSubjectPort {
    subscribe(observer: NotificationObserverPort): void;
    unsubscribe(observer: NotificationObserverPort): void;
    notify(notification: NotificationData): Promise<void>;
}

export interface IConnectedClient {
    userId: string;
    connectedAt: Date;
}