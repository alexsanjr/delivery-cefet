// src/grpc/services/routing.grpc.service.ts
import { Injectable } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RoutingService } from '../../routing/services/routing.service';

@Injectable()
export class RoutingGrpcService {
  constructor(private readonly routingService: RoutingService) {}

  @GrpcMethod('RoutingService', 'CalculateRoute')
  async calculateRoute(data: any) {
    try {
      const route = await this.routingService.calculateRoute(
        data.origin,
        data.destination,
        data.strategy,
        data.waypoints || []
      );
      return route;
    } catch (error) {
      throw new Error(`Route calculation failed: ${error.message}`);
    }
  }

  @GrpcMethod('RoutingService', 'CalculateETA')
  async calculateETA(data: any) {
    try {
      const eta = await this.routingService.calculateETA(
        data.origin,
        data.destination,
        data.strategy,
        data.traffic_level || 1
      );
      return { eta_minutes: eta };
    } catch (error) {
      throw new Error(`ETA calculation failed: ${error.message}`);
    }
  }

  @GrpcMethod('RoutingService', 'OptimizeDeliveryRoute')
  async optimizeDeliveryRoute(data: any) {
    try {
      const result = await this.routingService.optimizeDeliveryRoute(
        data.depot,
        data.deliveries || [],
        data.vehicles || []
      );
      return result;
    } catch (error) {
      throw new Error(`Route optimization failed: ${error.message}`);
    }
  }
}