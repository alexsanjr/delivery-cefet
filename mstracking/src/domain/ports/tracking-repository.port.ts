import { TrackingPosition } from '../tracking-position.entity';

export interface TrackingRepositoryPort {
    save(position: TrackingPosition): Promise<TrackingPosition>;
    findByDeliveryId(deliveryId: string): Promise<TrackingPosition[]>;
    findLatestByDeliveryId(deliveryId: string): Promise<TrackingPosition | null>;
    findRecentPositions(deliveryId: string, limit: number): Promise<TrackingPosition[]>;
    count(deliveryId: string): Promise<number>;
}
