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
  strategy: string;
}

interface RouteResponse {
  total_distance: number;
  total_duration: number;
  cost_estimate: number;
}

interface RoutingService {
  CalculateRoute(data: RouteRequest): Observable<RouteResponse>;
}

@Injectable()
export class RoutingClient implements OnModuleInit {
  private routingService: RoutingService;

  constructor(@Inject('ROUTING_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.routingService = this.client.getService<RoutingService>('RoutingService');
  }

  calculateRoute(origin: Point, destination: Point, strategy: string = 'fastest') {
    return this.routingService.CalculateRoute({ origin, destination, strategy });
  }
}
