import { Injectable } from '@nestjs/common';
import type { TrackingRepositoryPort } from '../../domain/ports/tracking-repository.port';
import type { DeliveryTrackingRepositoryPort } from '../../domain/ports/delivery-tracking-repository.port';
import { TrackingPosition } from '../../domain/tracking-position.entity';
import { DeliveryTracking } from '../../domain/delivery-tracking.entity';
import type { OrderServicePort } from '../../domain/ports/external-services.port';
import { TypeORMTrackingRepository } from '../../infrastructure/persistence/typeorm-tracking.repository';
import { TypeORMDeliveryTrackingRepository } from '../../infrastructure/persistence/typeorm-delivery-tracking.repository';
import { OrdersGrpcAdapter } from '../../infrastructure/adapters/orders-grpc.adapter';

export interface StartTrackingInput {
    deliveryId: string;
    orderId: string;
    originLat: number;
    originLng: number;
    destinationLat: number;
    destinationLng: number;
}

@Injectable()
export class StartTrackingUseCase {
    constructor(
        private readonly trackingRepository: TypeORMTrackingRepository,
        private readonly deliveryTrackingRepository: TypeORMDeliveryTrackingRepository,
        private readonly orderService: OrdersGrpcAdapter,
    ) {}

    async execute(input: StartTrackingInput): Promise<TrackingPosition> {
        const existingDelivery = await this.deliveryTrackingRepository.findByDeliveryId(input.deliveryId);
        if (existingDelivery) {
            throw new Error(`Tracking already exists for delivery_id: ${input.deliveryId}`);
        }

        const existingTracking = await this.deliveryTrackingRepository.findByOrderId(input.orderId);
        if (existingTracking) {
            throw new Error(`Order ${input.orderId} already has tracking started`);
        }

        const order = await this.orderService.getOrder(parseInt(input.orderId));
        if (!order) {
            throw new Error(`Order not found: ${input.orderId}`);
        }

        if (order.status !== 'OUT_FOR_DELIVERY') {
            throw new Error(
                `Order ${input.orderId} must be OUT_FOR_DELIVERY to start tracking. Current status: ${order.status}`
            );
        }

        const tracking = new DeliveryTracking(
            crypto.randomUUID(),
            input.deliveryId,
            input.orderId,
            new Date(),
            null,
            'pending',
            input.destinationLat,
            input.destinationLng,
        );

        tracking.startDelivery();
        await this.deliveryTrackingRepository.save(tracking);

        const position = new TrackingPosition(
            crypto.randomUUID(),
            input.deliveryId,
            input.orderId,
            input.originLat,
            input.originLng,
            'system',
            new Date(),
            'active',
        );

        return await this.trackingRepository.save(position);
    }
}
