export interface MessagingPort {
    publishPositionUpdate(data: {
        deliveryId: string;
        orderId: string;
        latitude: number;
        longitude: number;
        deliveryPersonId: string;
        timestamp: Date;
    }): Promise<void>;

    publishTrackingStarted(data: {
        deliveryId: string;
        orderId: string;
        destinationLat: number;
        destinationLng: number;
    }): Promise<void>;

    publishDeliveryCompleted(data: {
        deliveryId: string;
        orderId: string;
        completedAt: Date;
    }): Promise<void>;
}
