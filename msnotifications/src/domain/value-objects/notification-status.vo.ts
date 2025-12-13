export enum NotificationStatusEnum {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PREPARING = 'PREPARING',
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
    ARRIVING = 'ARRIVING',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
}

export class NotificationStatus {
    private readonly value: NotificationStatusEnum;

    private constructor(value: NotificationStatusEnum) {
        this.value = value;
    }

    static create(value: string): NotificationStatus {
        const normalizedValue = value.toUpperCase();
        
        if (!Object.values(NotificationStatusEnum).includes(normalizedValue as NotificationStatusEnum)) {
            throw new Error(`Invalid notification status: ${value}. Valid values are: ${Object.values(NotificationStatusEnum).join(', ')}`);
        }

        return new NotificationStatus(normalizedValue as NotificationStatusEnum);
    }

    getValue(): string {
        return this.value;
    }

    isDelivered(): boolean {
        return this.value === NotificationStatusEnum.DELIVERED;
    }

    isCancelled(): boolean {
        return this.value === NotificationStatusEnum.CANCELLED;
    }

    isFinalStatus(): boolean {
        return this.isDelivered() || this.isCancelled();
    }

    equals(other: NotificationStatus): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
