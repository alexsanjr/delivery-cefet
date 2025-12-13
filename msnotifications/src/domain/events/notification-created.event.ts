import { DomainEvent } from './domain-event.interface';

export class NotificationCreatedEvent implements DomainEvent {
    public readonly occurredOn: Date;
    public readonly eventName = 'NotificationCreated';

    constructor(
        public readonly notificationId: string,
        public readonly userId: string,
        public readonly orderId: string,
        public readonly status: string,
        public readonly message: string,
        public readonly serviceOrigin: string,
    ) {
        this.occurredOn = new Date();
    }
}
