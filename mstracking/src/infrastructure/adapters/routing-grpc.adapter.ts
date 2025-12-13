import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { RoutingServicePort } from '../../domain/ports/external-services.port';

interface ETARequest {
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
}

interface ETAResponse {
  durationMinutes: number;
  distanceKm: number;
}

interface IRoutingService {
  CalculateETA(data: ETARequest): Observable<ETAResponse>;
}

@Injectable()
export class RoutingGrpcAdapter implements RoutingServicePort, OnModuleInit {
  private readonly logger = new Logger(RoutingGrpcAdapter.name);
  private routingService: IRoutingService;

  constructor(@Inject('ROUTING_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.routingService = this.client.getService<IRoutingService>('RoutingService');
  }

  async calculateETA(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ durationMinutes: number; distanceKm: number }> {
    try {
      const response = await firstValueFrom(
        this.routingService.CalculateETA({
          originLat: origin.lat,
          originLng: origin.lng,
          destinationLat: destination.lat,
          destinationLng: destination.lng,
        })
      );
      return response;
    } catch (error) {
      this.logger.error('Failed to calculate ETA:', error);
      throw new Error('ETA calculation unavailable');
    }
  }
}
