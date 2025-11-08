import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackingPosition } from '../entities/tracking.entity';
import { DeliveryTracking } from '../entities/delivery-tracking.entity';
import { PubSub } from 'graphql-subscriptions';
import { NotificationsClient } from '../../grpc/notifications.client';
import { OrdersClient } from '../../grpc/orders.client';
import { RoutingClient } from '../../grpc/routing.client';

interface PositionObserver {
  update(position: TrackingPosition): void;
}

@Injectable()
export class TrackingService {
  private observers: PositionObserver[] = [];
  private pubSub: PubSub = new PubSub();

  constructor(
    @InjectRepository(TrackingPosition)
    private trackingRepo: Repository<TrackingPosition>,
    @InjectRepository(DeliveryTracking)
    private deliveryTrackingRepo: Repository<DeliveryTracking>,
    private readonly notificationsClient: NotificationsClient,
    private readonly ordersClient: OrdersClient,
    private readonly routingClient: RoutingClient,
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

  private async getUserIdFromOrder(orderId: string): Promise<string> {
    try {
      const order = await this.ordersClient.getOrder(parseInt(orderId, 10));
      if (order && order.customerId) {
        return `customer-${order.customerId}`;
      }
    } catch (error) {
      this.logAction('Failed to get customer ID from order', { 
        orderId, 
        error: error.message 
      });
    }
    return `order-${orderId}`;
  }

  async startTracking(data: {
    delivery_id: string;
    order_id: string;
    origin_lat: number;
    origin_lng: number;
    destination_lat: number;
    destination_lng: number;
  }): Promise<TrackingPosition> {
    const existingDelivery = await this.deliveryTrackingRepo.findOne({
      where: { delivery_id: data.delivery_id },
    });

    if (existingDelivery) {
      throw new Error(`Tracking already exists for delivery_id: ${data.delivery_id}`);
    }

    const existingTracking = await this.deliveryTrackingRepo.findOne({
      where: { order_id: data.order_id },
    });

    if (existingTracking) {
      throw new Error(`Order ${data.order_id} already has tracking started`);
    }

    const order = await this.ordersClient.getOrder(parseInt(data.order_id));
    if (!order) {
      throw new Error(`Order not found: ${data.order_id}`);
    }

    if (order.status !== 'OUT_FOR_DELIVERY') {
      throw new Error(
        `Order ${data.order_id} must be OUT_FOR_DELIVERY to start tracking. Current status: ${order.status}`
      );
    }

    await this.deliveryTrackingRepo.save({
      delivery_id: data.delivery_id,
      order_id: data.order_id,
      destination_lat: data.destination_lat,
      destination_lng: data.destination_lng,
      status: 'in_transit',
    });

    const position = this.createPosition({
      delivery_id: data.delivery_id,
      order_id: data.order_id,
      latitude: data.origin_lat,
      longitude: data.origin_lng,
      delivery_person_id: 'system',
    });

    const savedPosition = await this.trackingRepo.save(position);

    try {
      const userId = await this.getUserIdFromOrder(data.order_id);
      await this.notificationsClient.notifyOrderConfirmed(
        userId,
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
    const existingTracking = await this.trackingRepo.findOne({
      where: { delivery_id: data.delivery_id },
      order: { timestamp: 'DESC' },
    });

    if (!existingTracking) {
      throw new Error(`Tracking not found for delivery_id: ${data.delivery_id}`);
    }

    const deliveryTracking = await this.deliveryTrackingRepo.findOne({
      where: { delivery_id: data.delivery_id },
    });

    if (deliveryTracking?.status === 'DELIVERED') {
      throw new Error(`Cannot update position: delivery ${data.delivery_id} is already completed`);
    }

    const position = this.createPosition({
      ...data,
      order_id: existingTracking.order_id,
    });

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

    const positionCount = await this.trackingRepo.count({
      where: { delivery_id: data.delivery_id },
    });
    
    const isFirstMove = positionCount === 2;
    if (isFirstMove) {
      try {
        const userId = await this.getUserIdFromOrder(savedPosition.order_id);
        await this.notificationsClient.notifyOutForDelivery(
          userId,
          savedPosition.order_id,
        );
        this.logAction('Notification sent: OUT_FOR_DELIVERY', { order_id: savedPosition.order_id });
      } catch (error) {
        this.logAction('Failed to send notification', { error: error.message });
      }
    }

    const firstPosition = await this.trackingRepo.findOne({
      where: { delivery_id: data.delivery_id },
      order: { timestamp: 'ASC' },
    });

    if (firstPosition) {
      const eta = await this.routingClient.calculateETA(
        savedPosition.latitude,
        savedPosition.longitude,
        firstPosition.latitude,
        firstPosition.longitude,
        'fastest',
        1,
      );

      if (eta <= 5) {
        try {
          const userId = await this.getUserIdFromOrder(savedPosition.order_id);
          await this.notificationsClient.notifyArrivingSoon(
            userId,
            savedPosition.order_id,
          );
          this.logAction('Notification sent: ARRIVING_SOON', { order_id: savedPosition.order_id });
        } catch (error) {
          this.logAction('Failed to send notification', { error: error.message });
        }
      }
    }

    return savedPosition;
  }

  async markAsDelivered(orderId: string, deliveryId: string): Promise<void> {
    const existingTracking = await this.deliveryTrackingRepo.findOne({
      where: { delivery_id: deliveryId },
    });

    if (!existingTracking) {
      throw new Error(`Tracking not found for delivery_id: ${deliveryId}`);
    }

    if (existingTracking.order_id !== orderId) {
      throw new Error(`Order ${orderId} does not match delivery ${deliveryId}`);
    }

    if (existingTracking.status === 'DELIVERED') {
      throw new Error(`Order ${orderId} is already marked as delivered`);
    }

    await this.deliveryTrackingRepo.update(
      { delivery_id: deliveryId },
      { status: 'DELIVERED', completed_at: new Date() }
    );

    try {
      await this.ordersClient.markAsDelivered(parseInt(orderId));
      this.logAction('Order status updated: DELIVERED', { order_id: orderId });
    } catch (error) {
      this.logAction('Failed to update order status', { error: error.message });
      throw error;
    }

    try {
      const userId = await this.getUserIdFromOrder(orderId);
      await this.notificationsClient.notifyDelivered(
        userId,
        orderId,
      );
      this.logAction('Notification sent: DELIVERED', { order_id: orderId });
    } catch (error) {
      this.logAction('Failed to send notification', { error: error.message });
    }
  }



  async getTrackingData(deliveryId: string): Promise<any> {
    const positions = await this.trackingRepo.find({
      where: { delivery_id: deliveryId },
      order: { timestamp: 'ASC' },
    });

    const latestPosition = positions[positions.length - 1];
    
    const deliveryTracking = await this.deliveryTrackingRepo.findOne({
      where: { delivery_id: deliveryId },
    });

    if (!deliveryTracking) {
      throw new Error(`Delivery tracking not found for delivery_id: ${deliveryId}`);
    }
    
    const eta = await this.routingClient.calculateETA(
      latestPosition.latitude,
      latestPosition.longitude,
      deliveryTracking.destination_lat,
      deliveryTracking.destination_lng,
      'fastest',
      1,
    );

    const etaMinutes = eta || 30;
    
    return {
      delivery_id: deliveryId,
      positions: positions.map(p => ({
        latitude: p.latitude,
        longitude: p.longitude,
        timestamp: p.timestamp.toISOString(),
      })),
      status: 'IN_TRANSIT',
      estimated_arrival: new Date(Date.now() + etaMinutes * 60000).toISOString(),
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