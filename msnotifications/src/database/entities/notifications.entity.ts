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
}
