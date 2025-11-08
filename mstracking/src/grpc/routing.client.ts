import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';

interface Point {
    latitude: number;
    longitude: number;
}

interface ETARequest {
    origin: Point;
    destination: Point;
    strategy?: string;
    traffic_level?: number;
}

interface ETAResponse {
    eta_minutes: number;
    distance_meters: number;
    current_traffic: string;
}

interface IRoutingService {
    CalculateETA(data: ETARequest): Observable<ETAResponse>;
}

@Injectable()
export class RoutingClient implements OnModuleInit {
    private readonly logger = new Logger(RoutingClient.name);
    private routingService: IRoutingService;

    constructor(
        @Inject('ROUTING_PACKAGE') private readonly client: ClientGrpc,
    ) { }

    onModuleInit() {
        this.routingService = this.client.getService<IRoutingService>('RoutingService');
        this.logger.log('RoutingClient initialized');
    }

    async calculateETA(
        currentLat: number,
        currentLng: number,
        destinationLat: number,
        destinationLng: number,
        strategy: string = 'fastest',
        trafficLevel: number = 1,
    ): Promise<number> {
        try {
            const response = await firstValueFrom(
                this.routingService.CalculateETA({
                    origin: {
                        latitude: currentLat,
                        longitude: currentLng,
                    },
                    destination: {
                        latitude: destinationLat,
                        longitude: destinationLng,
                    },
                    strategy,
                    traffic_level: trafficLevel,
                }),
            );

            const eta = response?.eta_minutes || this.calculateFallbackETA(currentLat, currentLng, destinationLat, destinationLng);
            
            this.logger.log(`ETA calculated: ${eta} minutes`);

            return eta;
        } catch (error) {
            const fallbackETA = this.calculateFallbackETA(currentLat, currentLng, destinationLat, destinationLng);
            this.logger.log(`Using fallback ETA: ${fallbackETA} minutes`);
            return fallbackETA;
        }
    }

    private calculateFallbackETA(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distanceKm = R * c;
        return Math.ceil((distanceKm / 40) * 60);
    }
}
