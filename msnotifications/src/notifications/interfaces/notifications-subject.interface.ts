import { INotificationObserver } from "./notifications-observer.interface";
import { NotificationData } from "./notifications-data.interface";

export interface INotificationSubject {
    subscribe(observer: INotificationObserver): void;
    unsubscribe(observer: INotificationObserver): void;
    notify(notification: NotificationData): Promise<void>;
}