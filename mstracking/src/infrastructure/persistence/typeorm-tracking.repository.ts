import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackingRepositoryPort } from '../../domain/ports/tracking-repository.port';
import { TrackingPosition } from '../../domain/tracking-position.entity';
import { TrackingPositionORM } from './tracking-position.orm';

@Injectable()
export class TypeORMTrackingRepository implements TrackingRepositoryPort {
    constructor(
        @InjectRepository(TrackingPositionORM)
        private readonly repository: Repository<TrackingPositionORM>,
    ) {}

    async save(position: TrackingPosition): Promise<TrackingPosition> {
        const orm = this.repository.create({
            id: position.id,
            delivery_id: position.deliveryId,
            order_id: position.orderId,
            latitude: position.latitude,
            longitude: position.longitude,
            delivery_person_id: position.deliveryPersonId,
            timestamp: position.timestamp,
            status: position.status,
        });

        const saved = await this.repository.save(orm);
        return this.toDomain(saved);
    }

    async findByDeliveryId(deliveryId: string): Promise<TrackingPosition[]> {
        const orms = await this.repository.find({
            where: { delivery_id: deliveryId },
            order: { timestamp: 'DESC' },
        });

        return orms.map(this.toDomain);
    }

    async findLatestByDeliveryId(deliveryId: string): Promise<TrackingPosition | null> {
        const orm = await this.repository.findOne({
            where: { delivery_id: deliveryId },
            order: { timestamp: 'DESC' },
        });

        return orm ? this.toDomain(orm) : null;
    }

    async findRecentPositions(deliveryId: string, limit: number): Promise<TrackingPosition[]> {
        const orms = await this.repository.find({
            where: { delivery_id: deliveryId },
            order: { timestamp: 'DESC' },
            take: limit,
        });

        return orms.map(this.toDomain);
    }

    async count(deliveryId: string): Promise<number> {
        return this.repository.count({
            where: { delivery_id: deliveryId },
        });
    }

    private toDomain(orm: TrackingPositionORM): TrackingPosition {
        return new TrackingPosition(
            orm.id,
            orm.delivery_id,
            orm.order_id,
            orm.latitude,
            orm.longitude,
            orm.delivery_person_id,
            orm.timestamp,
            orm.status,
        );
    }
}
