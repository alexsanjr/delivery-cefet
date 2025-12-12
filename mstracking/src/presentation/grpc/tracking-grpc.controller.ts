import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TrackingApplicationService } from '../../application/services/tracking-application.service';

@Controller()
export class TrackingGrpcController {
    constructor(private readonly trackingService: TrackingApplicationService) {}

    @GrpcMethod('TrackingService', 'StartTracking')
    async startTracking(data: {
        delivery_id: string;
        order_id: string;
        destination_lat: number;
        destination_lng: number;
    }): Promise<{ success: boolean; message: string; tracking_id: string }> {
        try {
            const position = await this.trackingService.startTracking({
                deliveryId: data.delivery_id,
                orderId: data.order_id,
                originLat: 0,
                originLng: 0,
                destinationLat: data.destination_lat,
                destinationLng: data.destination_lng,
            });

            return {
                success: true,
                message: 'Tracking started successfully',
                tracking_id: position.id,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
                tracking_id: '',
            };
        }
    }

    @GrpcMethod('TrackingService', 'UpdatePosition')
    async updatePosition(data: {
        delivery_id: string;
        latitude: number;
        longitude: number;
        delivery_person_id: string;
    }): Promise<{ success: boolean; message: string }> {
        try {
            await this.trackingService.updatePosition({
                deliveryId: data.delivery_id,
                latitude: data.latitude,
                longitude: data.longitude,
                deliveryPersonId: data.delivery_person_id,
            });

            return {
                success: true,
                message: 'Position updated successfully',
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    @GrpcMethod('TrackingService', 'GetTrackingData')
    async getTrackingData(data: { delivery_id: string }) {
        try {
            const trackingData = await this.trackingService.getTrackingData(data.delivery_id);
            
            return {
                delivery_id: trackingData.deliveryId,
                positions: trackingData.positions.map(p => ({
                    latitude: p.latitude,
                    longitude: p.longitude,
                    timestamp: p.timestamp.getTime(),
                })),
                status: trackingData.status,
                estimated_arrival: trackingData.estimatedArrival || '',
            };
        } catch (error) {
            throw error;
        }
    }
}
