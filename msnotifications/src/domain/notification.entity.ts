export class NotificationEntity {
    id: string;
    userId: string;
    orderId: string;
    status: string;
    message: string;
    serviceOrigin: string;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;

    markAsRead(): void {
        if (this.isRead) {
            throw new Error('Notification is already marked as read');
        }
        this.isRead = true;
        this.updatedAt = new Date();
    }

    isDelivered(): boolean {
        return this.status === 'DELIVERED';
    }

    isCancelled(): boolean {
        return this.status === 'CANCELLED';
    }

    isFinalStatus(): boolean {
        return this.isDelivered() || this.isCancelled();
    }
}