import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';

interface StartTrackingRequest {
  delivery_id: string;
  order_id: string;
  destination_lat: number;
  destination_lng: number;
}

interface TrackingResponse {
  success: boolean;
  message: string;
  tracking_id: string;
}

interface ITrackingService {
  StartTracking(data: StartTrackingRequest): Observable<TrackingResponse>;
}

@Injectable()
export class TrackingClient implements OnModuleInit {
  private readonly logger = new Logger(TrackingClient.name);
  private trackingService: ITrackingService;

  constructor(
    @Inject('TRACKING_PACKAGE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.trackingService = this.client.getService<ITrackingService>('TrackingService');
    this.logger.log('TrackingClient initialized');
  }

  async startTracking(
    deliveryId: string,
    orderId: string,
    destinationLat: number,
    destinationLng: number,
  ): Promise<TrackingResponse> {
    try {
      const response = await firstValueFrom(
        this.trackingService.StartTracking({
          delivery_id: deliveryId,
          order_id: orderId,
          destination_lat: destinationLat,
          destination_lng: destinationLng,
        }),
      );

      this.logger.log(
        `Tracking started: deliveryId=${deliveryId}, orderId=${orderId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to start tracking: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
