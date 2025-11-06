import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackingPosition } from '../entities/tracking.entity';
import { PubSub } from 'graphql-subscriptions';
import { NotificationsClient } from '../../grpc/notifications.client';
import { OrdersClient } from '../../grpc/orders.client';

interface PositionObserver {
  update(position: TrackingPosition): void;
}

interface ETAStrategy {
  calculateETA(currentPos: any, destination: any): number;
}

class DrivingETAStrategy implements ETAStrategy {
  calculateETA(currentPos: any, destination: any): number {
    return 15;
  }
}

@Injectable()
export class TrackingService {
  private observers: PositionObserver[] = [];
  private etaStrategy: ETAStrategy = new DrivingETAStrategy();
  private pubSub: PubSub = new PubSub();

  constructor(
    @InjectRepository(TrackingPosition)
    private trackingRepo: Repository<TrackingPosition>,
    private readonly notificationsClient: NotificationsClient,
    private readonly ordersClient: OrdersClient,
  ) {}

  private createPosition(data: any): TrackingPosition {
    return this.trackingRepo.create({
      delivery_id: data.delivery_id,
      order_id: data.order_id,
      latitude: data.latitude,
      longitude: data.longitude,
      delivery_person_id: data.delivery_person_id,
    });
  }

  attach(observer: PositionObserver): void {
    this.observers.push(observer);
  }

  detach(observer: PositionObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  private notifyObservers(position: TrackingPosition): void {
    this.observers.forEach(observer => observer.update(position));
  }

  async startTracking(data: {
    delivery_id: string;
    order_id: string;
    destination_lat: number;
    destination_lng: number;
  }): Promise<TrackingPosition> {
    const position = this.createPosition({
      ...data,
      latitude: data.destination_lat,
      longitude: data.destination_lng,
      delivery_person_id: 'system',
    });

    const savedPosition = await this.trackingRepo.save(position);

    try {
      await this.notificationsClient.notifyOrderConfirmed(
        'user-id-placeholder',
        data.order_id,
      );
      this.logAction('Notification sent: ORDER_CONFIRMED', { order_id: data.order_id });
    } catch (error) {
      this.logAction('Failed to send notification', { error: error.message });
    }

    return savedPosition;
  }

  async updatePosition(data: {
    delivery_id: string;
    latitude: number;
    longitude: number;
    delivery_person_id: string;
  }): Promise<TrackingPosition> {
    const position = this.createPosition(data);
    const savedPosition = await this.trackingRepo.save(position);

    this.notifyObservers(savedPosition);

    await this.pubSub.publish('positionUpdated', {
      positionUpdated: {
        delivery_id: data.delivery_id,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: savedPosition.timestamp.toISOString(),
      },
    });

    const isFirstMove = await this.isFirstPositionUpdate(data.delivery_id);
    if (isFirstMove) {
      try {
        await this.notificationsClient.notifyOutForDelivery(
          'user-id-placeholder',
          savedPosition.order_id,
        );
        this.logAction('Notification sent: OUT_FOR_DELIVERY', { order_id: savedPosition.order_id });
      } catch (error) {
        this.logAction('Failed to send notification', { error: error.message });
      }
    }

    const eta = this.etaStrategy.calculateETA(savedPosition, null);
    if (eta <= 5) {
      try {
        await this.notificationsClient.notifyArrivingSoon(
          'user-id-placeholder',
          savedPosition.order_id,
        );
        this.logAction('Notification sent: ARRIVING_SOON', { order_id: savedPosition.order_id });
      } catch (error) {
        this.logAction('Failed to send notification', { error: error.message });
      }
    }

    return savedPosition;
  }

  async markAsDelivered(orderId: string, deliveryId: string): Promise<void> {
    try {
      await this.ordersClient.markAsDelivered(parseInt(orderId));
      this.logAction('Order status updated: DELIVERED', { order_id: orderId });
    } catch (error) {
      this.logAction('Failed to update order status', { error: error.message });
      throw error;
    }

    try {
      await this.notificationsClient.notifyDelivered(
        'user-id-placeholder',
        orderId,
      );
      this.logAction('Notification sent: DELIVERED', { order_id: orderId });
    } catch (error) {
      this.logAction('Failed to send notification', { error: error.message });
    }
  }

  private async isFirstPositionUpdate(deliveryId: string): Promise<boolean> {
    const count = await this.trackingRepo.count({
      where: { delivery_id: deliveryId },
    });
    return count === 1;
  }

  async getTrackingData(deliveryId: string): Promise<any> {
    const positions = await this.trackingRepo.find({
      where: { delivery_id: deliveryId },
      order: { timestamp: 'ASC' },
    });

    const latestPosition = positions[positions.length - 1];
    
    const eta = this.etaStrategy.calculateETA(
      latestPosition,
      { lat: -23.5505, lng: -46.6333 }
    );

    return {
      delivery_id: deliveryId,
      positions: positions.map(p => ({
        latitude: p.latitude,
        longitude: p.longitude,
        timestamp: p.timestamp.toISOString(),
      })),
      status: 'IN_TRANSIT',
      estimated_arrival: new Date(Date.now() + eta * 60000).toISOString(),
      distance_remaining: this.calculateDistanceRemaining(positions),
    };
  }

  async getActiveDeliveries(): Promise<any[]> {
    const activeDeliveries = await this.trackingRepo
      .createQueryBuilder('tracking')
      .select('DISTINCT tracking.delivery_id')
      .where('tracking.timestamp > :timestamp', {
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      })
      .getRawMany();

    return Promise.all(
      activeDeliveries.map(delivery => 
        this.getTrackingData(delivery.delivery_id)
      )
    );
  }

  async getRecentPositions(deliveryId: string): Promise<any[]> {
    const positions = await this.trackingRepo.find({
      where: { delivery_id: deliveryId },
      order: { timestamp: 'DESC' },
      take: 10,
    });

    return positions;
  }

  private calculateDistanceRemaining(positions: TrackingPosition[]): number {
    return 5.2;
  }

  private logAction(action: string, data: any): void {
    console.log(`[TrackingService] ${action}:`, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}