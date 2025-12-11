import { Injectable } from '@nestjs/common';
import { Position } from '../../domain/value-objects/position.vo';
import { ETA } from '../../domain/value-objects/eta.vo';
import { TypeORMTrackingRepository } from '../../infrastructure/persistence/typeorm-tracking.repository';
import { TypeORMDeliveryTrackingRepository } from '../../infrastructure/persistence/typeorm-delivery-tracking.repository';
import { RoutingGrpcAdapter } from '../../infrastructure/adapters/routing-grpc.adapter';

export interface TrackingData {
    deliveryId: string;
    orderId: string;
    positions: Array<{
        latitude: number;
        longitude: number;
        timestamp: Date;
    }>;
    status: string;
    estimatedArrival?: string;
    distanceRemaining?: number;
}

@Injectable()
export class GetTrackingDataUseCase {
    constructor(
        private readonly trackingRepository: TypeORMTrackingRepository,
        private readonly deliveryTrackingRepository: TypeORMDeliveryTrackingRepository,
        private readonly routingService: RoutingGrpcAdapter,
    ) {}

    async execute(deliveryId: string): Promise<TrackingData> {
        const deliveryTracking = await this.deliveryTrackingRepository.findByDeliveryId(deliveryId);
        if (!deliveryTracking) {
            throw new Error(`Delivery tracking not found: ${deliveryId}`);
        }

        const positions = await this.trackingRepository.findRecentPositions(deliveryId, 10);

        const trackingData: TrackingData = {
            deliveryId: deliveryTracking.deliveryId,
            orderId: deliveryTracking.orderId,
            positions: positions.map(p => ({
                latitude: p.latitude,
                longitude: p.longitude,
                timestamp: p.timestamp,
            })),
            status: deliveryTracking.status,
        };

        if (positions.length > 0 && deliveryTracking.isInTransit()) {
            const latestPosition = positions[0];
            const currentPos = new Position(latestPosition.latitude, latestPosition.longitude);
            const destinationPos = new Position(deliveryTracking.destinationLat, deliveryTracking.destinationLng);

            const distanceRemaining = currentPos.distanceTo(destinationPos);
            trackingData.distanceRemaining = distanceRemaining;

            try {
                const etaData = await this.routingService.calculateETA(
                    { lat: latestPosition.latitude, lng: latestPosition.longitude },
                    { lat: deliveryTracking.destinationLat, lng: deliveryTracking.destinationLng }
                );

                const eta = new ETA(
                    new Date(Date.now() + etaData.durationMinutes * 60000),
                    distanceRemaining,
                    etaData.durationMinutes * 60
                );

                trackingData.estimatedArrival = eta.estimatedArrival.toISOString();
            } catch (error) {
                trackingData.estimatedArrival = 'unavailable';
            }
        }

        return trackingData;
    }
}
