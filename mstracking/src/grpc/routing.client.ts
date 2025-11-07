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
    traffic_condition: string;
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

            this.logger.log(
                `ETA calculated: ${response.eta_minutes} minutes (${response.traffic_condition})`,
            );

            return response.eta_minutes;
        } catch (error) {
            this.logger.error(
                `Failed to calculate ETA: ${error.message}`,
                error.stack,
            );
            return 15;
        }
    }
}
