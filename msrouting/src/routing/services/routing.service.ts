import { Injectable, Inject } from '@nestjs/common';
import { 
  RouteStrategy, 
  Point, 
  RouteResponse, 
  TrafficLevel, 
  ETAResponse, 
  DeliveryPoint, 
  Vehicle, 
  OptimizedRouteResponse 
} from '../dto/routing.objects';
import { FastestRouteStrategy } from '../strategies/fastest-route.strategy';
import { EconomicalRouteStrategy } from '../strategies/economical-route.strategy';
import { EcoFriendlyRouteStrategy } from '../strategies/eco-friendly.strategy';
import { ShortestRouteStrategy } from '../strategies/shortest-route.strategy';
import { RouteOptimizerService } from './route-optimizer.service';

@Injectable()
export class RoutingService {
  private strategies: Map<RouteStrategy, any> = new Map();

  constructor(
    @Inject(FastestRouteStrategy) private fastestStrategy: FastestRouteStrategy,
    @Inject(EconomicalRouteStrategy) private economicalStrategy: EconomicalRouteStrategy,
    @Inject(EcoFriendlyRouteStrategy) private ecoFriendlyStrategy: EcoFriendlyRouteStrategy,
    @Inject(ShortestRouteStrategy) private shortestStrategy: ShortestRouteStrategy,
    private routeOptimizer: RouteOptimizerService,
  ) {
    this.strategies.set(RouteStrategy.FASTEST, this.fastestStrategy);
    this.strategies.set(RouteStrategy.SHORTEST, this.shortestStrategy);
    this.strategies.set(RouteStrategy.ECONOMICAL, this.economicalStrategy);
    this.strategies.set(RouteStrategy.ECO_FRIENDLY, this.ecoFriendlyStrategy);
  }

  async calculateRoute(
    origin: Point, 
    destination: Point, 
    strategy: RouteStrategy = RouteStrategy.FASTEST,
    waypoints: Point[] = []
  ): Promise<RouteResponse> {
    const selectedStrategy = this.strategies.get(strategy) || this.fastestStrategy;
    return await selectedStrategy.calculateRoute(origin, destination, waypoints);
  }

  async calculateETA(
    origin: Point,
    destination: Point,
    strategy: RouteStrategy = RouteStrategy.FASTEST,
    trafficLevel: TrafficLevel = TrafficLevel.MODERATE
  ): Promise<ETAResponse> {
    const selectedStrategy = this.strategies.get(strategy) || this.fastestStrategy;
    const route = await selectedStrategy.calculateRoute(origin, destination);
    
    return {
      eta_minutes: Math.floor(route.duration_seconds / 60),
      distance_meters: route.distance_meters,
      current_traffic: trafficLevel,
    };
  }

  async optimizeDeliveryRoute(
    depot: Point,
    deliveries: DeliveryPoint[],
    vehicles: Vehicle[] = [{
      vehicle_id: 'default',
      type: 'car',
      capacity_kg: 10,
      max_speed_kph: 40,
    }]
  ): Promise<OptimizedRouteResponse> {
    const optimizedRoutes = await this.routeOptimizer.solveVRP(depot, deliveries, vehicles);
    
    // Mapear os dados do RouteOptimizer para o formato esperado pelo GraphQL
    const vehicleRoutes = await Promise.all(optimizedRoutes.map(async (optimizedRoute) => {
      // Criar uma rota usando a estratégia fastest para cada veículo
      const routePoints = [depot, ...optimizedRoute.deliveries.map(d => d.location), depot];
      const fullRoute = await this.calculateRoute(routePoints[0], routePoints[routePoints.length - 1], RouteStrategy.FASTEST, routePoints.slice(1, -1));
      
      return {
        vehicle: optimizedRoute.vehicle,
        assigned_deliveries: optimizedRoute.deliveries,
        route: {
          ...fullRoute,
          distance_meters: optimizedRoute.total_distance,
          duration_seconds: optimizedRoute.total_duration,
        },
      };
    }));
    
    return {
      vehicle_routes: vehicleRoutes,
      total_cost: optimizedRoutes.reduce((sum, route) => sum + this.calculateRouteCost(route), 0),
      total_distance_meters: optimizedRoutes.reduce((sum, route) => sum + route.total_distance, 0),
      total_duration_seconds: optimizedRoutes.reduce((sum, route) => sum + route.total_duration, 0),
    };
  }

  private calculateRouteCost(route: any): number {
    const distanceKm = route.total_distance / 1000;
    return distanceKm * 0.5;
  }
}