// src/routing/resolvers/routing.resolver.ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { RoutingService } from '../services/routing.service';
import { 
  RouteResponse, 
  ETAResponse, 
  OptimizedRouteResponse,
  Point,
  DeliveryPoint,
  Vehicle 
} from '../dto/routing.objects';

@Resolver()
export class RoutingResolver {
  constructor(private readonly routingService: RoutingService) {}

  @Query(() => RouteResponse)
  async calculateRoute(
    @Args('origin') origin: Point,
    @Args('destination') destination: Point,
    @Args('strategy', { nullable: true }) strategy?: string,
  ): Promise<RouteResponse> {
    return this.routingService.calculateRoute(origin, destination, strategy);
  }

  @Query(() => ETAResponse)
  async calculateETA(
    @Args('origin') origin: Point,
    @Args('destination') destination: Point,
    @Args('strategy', { nullable: true }) strategy?: string,
  ): Promise<ETAResponse> {
    const etaMinutes = await this.routingService.calculateETA(origin, destination, strategy);
    return { 
      eta_minutes: etaMinutes,
      distance_meters: 0, // Implementar cálculo real
      traffic_condition: 'normal'
    };
  }

  @Mutation(() => OptimizedRouteResponse)
  async optimizeDeliveryRoute(
    @Args('depot') depot: Point,
    @Args('deliveries', { type: () => [DeliveryPoint] }) deliveries: DeliveryPoint[],
    @Args('vehicles', { type: () => [Vehicle], nullable: true }) vehicles?: Vehicle[],
  ): Promise<OptimizedRouteResponse> {
    return this.routingService.optimizeDeliveryRoute(depot, deliveries, vehicles);
  }
}