import { DeliveryTracking } from '../delivery-tracking.entity';

export interface DeliveryTrackingRepositoryPort {
    save(tracking: DeliveryTracking): Promise<DeliveryTracking>;
    findByDeliveryId(deliveryId: string): Promise<DeliveryTracking | null>;
    findByOrderId(orderId: string): Promise<DeliveryTracking | null>;
    findActiveDeliveries(): Promise<DeliveryTracking[]>;
    update(tracking: DeliveryTracking): Promise<void>;
}
