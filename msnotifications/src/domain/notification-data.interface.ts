export interface NotificationData {
    orderId: string;
    userId: string;
    status: string;
    message: string;
    serviceOrigin: string;
    additionalInfo?: string;
}
