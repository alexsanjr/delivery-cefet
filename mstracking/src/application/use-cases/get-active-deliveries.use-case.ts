import { Injectable } from '@nestjs/common';
import { TypeORMDeliveryTrackingRepository } from '../../infrastructure/persistence/typeorm-delivery-tracking.repository';
import { TypeORMTrackingRepository } from '../../infrastructure/persistence/typeorm-tracking.repository';

export interface ActiveDelivery {
    deliveryId: string;
    orderId: string;
    status: string;
    startedAt: Date;
    recentPositionsCount: number;
}

@Injectable()
export class GetActiveDeliveriesUseCase {
    constructor(
        private readonly deliveryTrackingRepository: TypeORMDeliveryTrackingRepository,
        private readonly trackingRepository: TypeORMTrackingRepository,
    ) {}

    async execute(): Promise<ActiveDelivery[]> {
        const activeDeliveries = await this.deliveryTrackingRepository.findActiveDeliveries();

        const deliveriesWithCounts = await Promise.all(
            activeDeliveries.map(async (delivery) => {
                const count = await this.trackingRepository.count(delivery.deliveryId);
                return {
                    deliveryId: delivery.deliveryId,
                    orderId: delivery.orderId,
                    status: delivery.status,
                    startedAt: delivery.startedAt,
                    recentPositionsCount: count,
                };
            })
        );

        return deliveriesWithCounts;
    }
}
