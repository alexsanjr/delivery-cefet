import { Injectable } from '@nestjs/common';
import { StartTrackingUseCase, StartTrackingInput } from '../use-cases/start-tracking.use-case';
import { UpdatePositionUseCase, UpdatePositionInput } from '../use-cases/update-position.use-case';
import { GetTrackingDataUseCase, TrackingData } from '../use-cases/get-tracking-data.use-case';
import { GetActiveDeliveriesUseCase, ActiveDelivery } from '../use-cases/get-active-deliveries.use-case';
import { MarkAsDeliveredUseCase } from '../use-cases/mark-as-delivered.use-case';
import { TrackingPosition } from '../../domain/tracking-position.entity';

@Injectable()
export class TrackingApplicationService {
    constructor(
        private readonly startTrackingUseCase: StartTrackingUseCase,
        private readonly updatePositionUseCase: UpdatePositionUseCase,
        private readonly getTrackingDataUseCase: GetTrackingDataUseCase,
        private readonly getActiveDeliveriesUseCase: GetActiveDeliveriesUseCase,
        private readonly markAsDeliveredUseCase: MarkAsDeliveredUseCase,
    ) {}

    async startTracking(input: StartTrackingInput): Promise<TrackingPosition> {
        return this.startTrackingUseCase.execute(input);
    }

    async updatePosition(input: UpdatePositionInput): Promise<TrackingPosition> {
        return this.updatePositionUseCase.execute(input);
    }

    async getTrackingData(deliveryId: string): Promise<TrackingData> {
        return this.getTrackingDataUseCase.execute(deliveryId);
    }

    async getActiveDeliveries(): Promise<ActiveDelivery[]> {
        return this.getActiveDeliveriesUseCase.execute();
    }

    async markAsDelivered(orderId: string, deliveryId: string): Promise<void> {
        return this.markAsDeliveredUseCase.execute(orderId, deliveryId);
    }
}
