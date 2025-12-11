export interface OrderServicePort {
    getOrder(orderId: number): Promise<{
        id: number;
        customerId: number;
        status: string;
    } | null>;
}

export interface NotificationServicePort {
    notifyOrderConfirmed(userId: string, orderId: string): Promise<void>;
    notifyOutForDelivery(userId: string, orderId: string): Promise<void>;
    notifyDelivered(userId: string, orderId: string): Promise<void>;
}

export interface RoutingServicePort {
    calculateETA(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<{
        durationMinutes: number;
        distanceKm: number;
    }>;
}
