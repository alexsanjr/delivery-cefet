import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';

interface Point {
  latitude: number;
  longitude: number;
}

interface RouteRequest {
  origin: Point;
  destination: Point;
  strategy: number; // RouteStrategy enum
  waypoints?: Point[];
}

interface RouteResponse {
  path: Point[];
  distance_meters: number;
  duration_seconds: number;
  encoded_polyline: string;
  steps: RouteStep[];
  estimated_cost: number;
}

interface RouteStep {
  instruction: string;
  distance_meters: number;
  duration_seconds: number;
  start_location: Point;
  end_location: Point;
}

interface RoutingService {
  CalculateRoute(data: RouteRequest): Observable<RouteResponse>;
}

// RouteStrategy enum values
enum RouteStrategy {
  STRATEGY_UNSPECIFIED = 0,
  FASTEST = 1,
  SHORTEST = 2,
  ECONOMICAL = 3,
  ECO_FRIENDLY = 4,
}

@Injectable()
export class RoutingClient implements OnModuleInit {
  private routingService: RoutingService;

  constructor(@Inject('ROUTING_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.routingService =
      this.client.getService<RoutingService>('RoutingService');
  }

  calculateRoute(
    origin: Point,
    destination: Point,
    strategy: string = 'fastest',
  ) {
    // Convert strategy string to enum
    const strategyEnum = this.getStrategyEnum(strategy);
    return this.routingService.CalculateRoute({
      origin,
      destination,
      strategy: strategyEnum,
      waypoints: [],
    });
  }

  private getStrategyEnum(strategy: string): number {
    const strategyMap: { [key: string]: number } = {
      fastest: RouteStrategy.FASTEST,
      shortest: RouteStrategy.SHORTEST,
      economical: RouteStrategy.ECONOMICAL,
      eco_friendly: RouteStrategy.ECO_FRIENDLY,
    };
    return strategyMap[strategy.toLowerCase()] || RouteStrategy.FASTEST;
  }
}
