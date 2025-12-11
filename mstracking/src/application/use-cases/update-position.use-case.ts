import { Injectable } from '@nestjs/common';
import { TrackingPosition } from '../../domain/tracking-position.entity';
import { TypeORMTrackingRepository } from '../../infrastructure/persistence/typeorm-tracking.repository';
import { TypeORMDeliveryTrackingRepository } from '../../infrastructure/persistence/typeorm-delivery-tracking.repository';
import { PositionSubjectAdapter } from '../../infrastructure/adapters/position-subject.adapter';
import { RabbitMQService } from '../../infrastructure/rabbitmq.service';

export interface UpdatePositionInput {
    deliveryId: string;
    latitude: number;
    longitude: number;
    deliveryPersonId: string;
}

@Injectable()
export class UpdatePositionUseCase {
    constructor(
        private readonly trackingRepository: TypeORMTrackingRepository,
        private readonly deliveryTrackingRepository: TypeORMDeliveryTrackingRepository,
        private readonly positionSubject: PositionSubjectAdapter,
        private readonly messaging: RabbitMQService,
    ) {}

    async execute(input: UpdatePositionInput): Promise<TrackingPosition> {
        const existingPosition = await this.trackingRepository.findLatestByDeliveryId(input.deliveryId);
        if (!existingPosition) {
            throw new Error(`Tracking not found for delivery_id: ${input.deliveryId}`);
        }

        const deliveryTracking = await this.deliveryTrackingRepository.findByDeliveryId(input.deliveryId);
        if (deliveryTracking?.isDelivered()) {
            throw new Error(`Cannot update position: delivery ${input.deliveryId} is already completed`);
        }

        const position = new TrackingPosition(
            crypto.randomUUID(),
            input.deliveryId,
            existingPosition.orderId,
            input.latitude,
            input.longitude,
            input.deliveryPersonId,
            new Date(),
            'active',
        );

        const savedPosition = await this.trackingRepository.save(position);

        this.positionSubject.notify(savedPosition);

        await this.messaging.publishPositionUpdate({
            deliveryId: savedPosition.deliveryId,
            orderId: savedPosition.orderId,
            latitude: savedPosition.latitude,
            longitude: savedPosition.longitude,
            deliveryPersonId: savedPosition.deliveryPersonId,
            timestamp: savedPosition.timestamp,
        });

        return savedPosition;
    }
}
