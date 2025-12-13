import { NotificationId } from './value-objects/notification-id.vo';
import { UserId } from './value-objects/user-id.vo';
import { OrderId } from './value-objects/order-id.vo';
import { NotificationStatus } from './value-objects/notification-status.vo';
import { ServiceOrigin } from './value-objects/service-origin.vo';

export class NotificationEntity {
    private readonly id: NotificationId;
    private readonly userId: UserId;
    private readonly orderId: OrderId;
    private readonly status: NotificationStatus;
    private readonly message: string;
    private readonly serviceOrigin: ServiceOrigin;
    private isReadFlag: boolean;
    private readonly createdAt: Date;
    private updatedAt: Date;

    private constructor(
        id: NotificationId,
        userId: UserId,
        orderId: OrderId,
        status: NotificationStatus,
        message: string,
        serviceOrigin: ServiceOrigin,
        isRead: boolean = false,
        createdAt?: Date,
        updatedAt?: Date,
    ) {
        this.id = id;
        this.userId = userId;
        this.orderId = orderId;
        this.status = status;
        this.message = this.validateMessage(message);
        this.serviceOrigin = serviceOrigin;
        this.isReadFlag = isRead;
        this.createdAt = createdAt || new Date();
        this.updatedAt = updatedAt || new Date();
    }

    static create(
        userId: UserId,
        orderId: OrderId,
        status: NotificationStatus,
        message: string,
        serviceOrigin: ServiceOrigin,
    ): NotificationEntity {
        const id = NotificationId.create();
        return new NotificationEntity(id, userId, orderId, status, message, serviceOrigin);
    }

    static reconstitute(
        id: NotificationId,
        userId: UserId,
        orderId: OrderId,
        status: NotificationStatus,
        message: string,
        serviceOrigin: ServiceOrigin,
        isRead: boolean,
        createdAt: Date,
        updatedAt: Date,
    ): NotificationEntity {
        return new NotificationEntity(
            id,
            userId,
            orderId,
            status,
            message,
            serviceOrigin,
            isRead,
            createdAt,
            updatedAt,
        );
    }

    private validateMessage(message: string): string {
        if (!message || message.trim().length === 0) {
            throw new Error('Notification message cannot be empty');
        }
        if (message.length > 500) {
            throw new Error('Notification message cannot exceed 500 characters');
        }
        return message.trim();
    }

    markAsRead(): void {
        if (this.isReadFlag) {
            throw new Error('Notification is already marked as read');
        }
        this.isReadFlag = true;
        this.updatedAt = new Date();
    }

    getId(): NotificationId {
        return this.id;
    }

    getUserId(): UserId {
        return this.userId;
    }

    getOrderId(): OrderId {
        return this.orderId;
    }

    getStatus(): NotificationStatus {
        return this.status;
    }

    getMessage(): string {
        return this.message;
    }

    getServiceOrigin(): ServiceOrigin {
        return this.serviceOrigin;
    }

    isRead(): boolean {
        return this.isReadFlag;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getUpdatedAt(): Date {
        return this.updatedAt;
    }

    isDelivered(): boolean {
        return this.status.isDelivered();
    }

    isCancelled(): boolean {
        return this.status.isCancelled();
    }

    isFinalStatus(): boolean {
        return this.status.isFinalStatus();
    }

    toPrimitives() {
        return {
            id: this.id.getValue(),
            userId: this.userId.getValue(),
            orderId: this.orderId.getValue(),
            status: this.status.getValue(),
            message: this.message,
            serviceOrigin: this.serviceOrigin.getValue(),
            isRead: this.isReadFlag,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}