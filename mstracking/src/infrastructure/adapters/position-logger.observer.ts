import { Injectable } from '@nestjs/common';
import { PositionObserverPort } from '../../domain/ports/position-observer.port';
import { TrackingPosition } from '../../domain/tracking-position.entity';

@Injectable()
export class PositionLoggerObserver implements PositionObserverPort {
  update(position: TrackingPosition): void {
    console.log(`[TRACKING] Position update for delivery ${position.deliveryId}:`, {
      orderId: position.orderId,
      latitude: position.latitude,
      longitude: position.longitude,
      deliveryPersonId: position.deliveryPersonId,
      timestamp: position.timestamp.toISOString(),
    });
  }
}
