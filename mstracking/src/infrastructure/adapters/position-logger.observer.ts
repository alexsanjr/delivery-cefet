import { Injectable, Logger } from '@nestjs/common';
import { PositionObserverPort } from '../../domain/ports/position-observer.port';
import { TrackingPosition } from '../../domain/tracking-position.entity';

@Injectable()
export class PositionLoggerObserver implements PositionObserverPort {
  private readonly logger = new Logger(PositionLoggerObserver.name);

  update(position: TrackingPosition): void {
    this.logger.log(`Position update for delivery ${position.deliveryId}:`, {
      orderId: position.orderId,
      latitude: position.latitude,
      longitude: position.longitude,
      deliveryPersonId: position.deliveryPersonId,
      timestamp: position.timestamp.toISOString(),
    });
  }
}
