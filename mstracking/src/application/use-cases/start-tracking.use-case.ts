import { Injectable } from '@nestjs/common';
import { TrackingPosition } from '../../domain/tracking-position.entity';
import { DeliveryTracking } from '../../domain/delivery-tracking.entity';
import { TypeORMTrackingRepository } from '../../infrastructure/persistence/typeorm-tracking.repository';
import { TypeORMDeliveryTrackingRepository } from '../../infrastructure/persistence/typeorm-delivery-tracking.repository';
import { RabbitMQService } from '../../infrastructure/rabbitmq.service';
import { PositionSubjectAdapter } from '../../infrastructure/adapters/position-subject.adapter';

export interface StartTrackingInput {
    deliveryId: string;
    orderId: string;
    latitude: number;
    longitude: number;
    deliveryPersonId: string;
    destinationLat: number;
    destinationLng: number;
}

@Injectable()
export class StartTrackingUseCase {
    constructor(
        private readonly trackingRepository: TypeORMTrackingRepository,
        private readonly deliveryTrackingRepository: TypeORMDeliveryTrackingRepository,
        private readonly messaging: RabbitMQService,
        private readonly positionSubject: PositionSubjectAdapter,
    ) {}

    async execute(input: StartTrackingInput): Promise<TrackingPosition> {
        const existingTracking = await this.deliveryTrackingRepository.findByDeliveryId(input.deliveryId);
        if (existingTracking) {
            throw new Error(`Tracking already exists for delivery: ${input.deliveryId}`);
        }

        const deliveryTracking = new DeliveryTracking(
            crypto.randomUUID(),
            input.deliveryId,
            input.orderId,
            new Date(),
            null,
            'pending',
            input.destinationLat,
            input.destinationLng,
        );

        await this.deliveryTrackingRepository.save(deliveryTracking);

        const position = new TrackingPosition(
            crypto.randomUUID(),
            input.deliveryId,
            input.orderId,
            input.latitude,
            input.longitude,
            input.deliveryPersonId,
            new Date(),
            'active',
        );

        const savedPosition = await this.trackingRepository.save(position);

        this.positionSubject.notify(savedPosition);

        await this.messaging.publishTrackingStarted({
            deliveryId: input.deliveryId,
            orderId: input.orderId,
            destinationLat: input.destinationLat,
            destinationLng: input.destinationLng,
        });
        return savedPosition;
    }
}
