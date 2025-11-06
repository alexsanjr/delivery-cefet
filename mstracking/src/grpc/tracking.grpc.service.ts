
import { Injectable } from '@nestjs/common';
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { TrackingService } from '../tracking/services/tracking.service';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class TrackingGrpcService {
  constructor(private readonly trackingService: TrackingService) {}

  @GrpcMethod('TrackingService', 'UpdatePosition')
  async updatePosition(data: any) {
    const position = await this.trackingService.updatePosition(data);
    return {
      success: true,
      message: 'Position updated successfully',
      tracking_id: position.delivery_id,
    };
  }

  @GrpcMethod('TrackingService', 'GetTrackingData')
  async getTrackingData(data: { delivery_id: string }) {
    return await this.trackingService.getTrackingData(data.delivery_id);
  }

  @GrpcMethod('TrackingService', 'StartTracking')
  async startTracking(data: any) {
    const position = await this.trackingService.startTracking(data);
    return {
      success: true,
      message: 'Tracking started successfully',
      tracking_id: position.delivery_id,
    };
  }

  @GrpcStreamMethod('TrackingService', 'SubscribeToUpdates')
  subscribeToUpdates(data$: Observable<any>): Observable<any> {
    const subject = new Subject();
    
    data$.subscribe({
      next: (data) => {
        this.handleSubscription(data, subject);
      },
      error: (err) => subject.error(err),
    });

    return subject.asObservable();
  }

  private async handleSubscription(data: any, subject: Subject<any>) {
    const { delivery_id } = data;
    
    const positions = await this.trackingService.getRecentPositions(delivery_id);
    subject.next({
      delivery_id,
      positions,
      timestamp: new Date().toISOString(),
    });
  }
}