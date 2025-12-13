import { randomUUID } from 'crypto';

export class NotificationId {
    private readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    static create(): NotificationId {
        return new NotificationId(randomUUID());
    }

    static from(value: string): NotificationId {
        if (!value || value.trim().length === 0) {
            throw new Error('NotificationId cannot be empty');
        }
        return new NotificationId(value);
    }

    getValue(): string {
        return this.value;
    }

    equals(other: NotificationId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
