import { DomainEvent } from './domain-event.interface';

export class NotificationReadEvent implements DomainEvent {
    public readonly occurredOn: Date;
    public readonly eventName = 'NotificationRead';

    constructor(
        public readonly notificationId: string,
        public readonly userId: string,
        public readonly readAt: Date,
    ) {
        this.occurredOn = new Date();
    }
}
