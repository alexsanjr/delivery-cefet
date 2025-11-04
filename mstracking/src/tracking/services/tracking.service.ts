// src/tracking/services/tracking.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackingPosition } from '../entities/tracking.entity';
import { PubSub } from 'graphql-subscriptions';

// Observer Pattern
interface PositionObserver {
  update(position: TrackingPosition): void;
}

// Strategy Pattern
interface ETAStrategy {
  calculateETA(currentPos: any, destination: any): number;
}

class DrivingETAStrategy implements ETAStrategy {
  calculateETA(currentPos: any, destination: any): number {
    // Implementar cálculo real de ETA
    return 15; // minutos
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
  ) {}

  // Factory Pattern - Criar nova posição
  private createPosition(data: any): TrackingPosition {
    return this.trackingRepo.create({
      delivery_id: data.delivery_id,
      order_id: data.order_id,
      latitude: data.latitude,
      longitude: data.longitude,
      delivery_person_id: data.delivery_person_id,
    });
  }

  // Observer Pattern
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

  // Repository Pattern
  async startTracking(data: {
    delivery_id: string;
    order_id: string;
    destination_lat: number;
    destination_lng: number;
  }): Promise<TrackingPosition> {
    const position = this.createPosition({
      ...data,
      latitude: data.destination_lat, // Posição inicial
      longitude: data.destination_lng,
      delivery_person_id: 'system',
    });

    return await this.trackingRepo.save(position);
  }

  async updatePosition(data: {
    delivery_id: string;
    latitude: number;
    longitude: number;
    delivery_person_id: string;
  }): Promise<TrackingPosition> {
    const position = this.createPosition(data);
    const savedPosition = await this.trackingRepo.save(position);

    // Observer Pattern - Notificar observadores
    this.notifyObservers(savedPosition);

    // PubSub para GraphQL Subscriptions
    await this.pubSub.publish('positionUpdated', {
      positionUpdated: {
        delivery_id: data.delivery_id,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: savedPosition.timestamp.toISOString(),
      },
    });

    return savedPosition;
  }

  async getTrackingData(deliveryId: string): Promise<any> {
    const positions = await this.trackingRepo.find({
      where: { delivery_id: deliveryId },
      order: { timestamp: 'ASC' },
    });

    const latestPosition = positions[positions.length - 1];
    
    // Strategy Pattern - Calcular ETA
    const eta = this.etaStrategy.calculateETA(
      latestPosition,
      { lat: -23.5505, lng: -46.6333 } // Exemplo
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
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // Últimas 2 horas
      })
      .getRawMany();

    return Promise.all(
      activeDeliveries.map(delivery => 
        this.getTrackingData(delivery.delivery_id)
      )
    );
  }

  private calculateDistanceRemaining(positions: TrackingPosition[]): number {
    // Implementar cálculo de distância
    return 5.2;
  }

  // Decorator Pattern (simulado) para logging
  private logAction(action: string, data: any): void {
    console.log(`[TrackingService] ${action}:`, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}