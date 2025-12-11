import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryTrackingRepositoryPort } from '../../domain/ports/delivery-tracking-repository.port';
import { DeliveryTracking } from '../../domain/delivery-tracking.entity';
import { DeliveryTrackingORM } from './delivery-tracking.orm';

@Injectable()
export class TypeORMDeliveryTrackingRepository implements DeliveryTrackingRepositoryPort {
    constructor(
        @InjectRepository(DeliveryTrackingORM)
        private readonly repository: Repository<DeliveryTrackingORM>,
    ) {}

    async save(tracking: DeliveryTracking): Promise<DeliveryTracking> {
        const orm = this.repository.create({
            id: tracking.id,
            delivery_id: tracking.deliveryId,
            order_id: tracking.orderId,
            started_at: tracking.startedAt,
            completed_at: tracking.completedAt ?? undefined,
            status: tracking.status,
            destination_lat: tracking.destinationLat,
            destination_lng: tracking.destinationLng,
        });

        const saved = await this.repository.save(orm);
        return this.toDomain(saved);
    }

    async findByDeliveryId(deliveryId: string): Promise<DeliveryTracking | null> {
        const orm = await this.repository.findOne({
            where: { delivery_id: deliveryId },
        });

        return orm ? this.toDomain(orm) : null;
    }

    async findByOrderId(orderId: string): Promise<DeliveryTracking | null> {
        const orm = await this.repository.findOne({
            where: { order_id: orderId },
        });

        return orm ? this.toDomain(orm) : null;
    }

    async findActiveDeliveries(): Promise<DeliveryTracking[]> {
        const orms = await this.repository.find({
            where: [
                { status: 'in_transit' },
                { status: 'pending' },
            ],
        });

        return orms.map(this.toDomain);
    }

    async update(tracking: DeliveryTracking): Promise<void> {
        await this.repository.update(
            { id: tracking.id },
            {
                status: tracking.status,
                completed_at: tracking.completedAt ?? undefined,
            }
        );
    }

    private toDomain(orm: DeliveryTrackingORM): DeliveryTracking {
        return new DeliveryTracking(
            orm.id,
            orm.delivery_id,
            orm.order_id,
            orm.started_at,
            orm.completed_at,
            orm.status,
            orm.destination_lat,
            orm.destination_lng,
        );
    }
}
