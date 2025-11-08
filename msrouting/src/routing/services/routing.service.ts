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
    if (origin.latitude === destination.latitude && origin.longitude === destination.longitude) {
      return {
        eta_minutes: 0,
        distance_meters: 0,
        current_traffic: trafficLevel,
      };
    }

    const selectedStrategy = this.strategies.get(strategy) || this.fastestStrategy;
    const route = await selectedStrategy.calculateRoute(origin, destination);
    
    if (!route || route.duration_seconds === undefined || route.duration_seconds === null) {
      const distanceMeters = this.haversineDistance(origin, destination);
      const velocidadeMediaKmh = 40;
      const distanciaKm = distanceMeters / 1000;
      const tempoHoras = distanciaKm / velocidadeMediaKmh;
      const tempoMinutos = Math.ceil(tempoHoras * 60);
      
      return {
        eta_minutes: tempoMinutos,
        distance_meters: Math.round(distanceMeters),
        current_traffic: trafficLevel,
      };
    }
    
    return {
      eta_minutes: Math.ceil(route.duration_seconds / 60),
      distance_meters: route.distance_meters,
      current_traffic: trafficLevel,
    };
  }

  private haversineDistance(point1: Point, point2: Point): number {
    const raioTerraMetros = 6371000;
    const lat1Rad = point1.latitude * Math.PI / 180;
    const lat2Rad = point2.latitude * Math.PI / 180;
    const deltaLatRad = (point2.latitude - point1.latitude) * Math.PI / 180;
    const deltaLonRad = (point2.longitude - point1.longitude) * Math.PI / 180;
    
    const sinDeltaLat = Math.sin(deltaLatRad / 2);
    const sinDeltaLon = Math.sin(deltaLonRad / 2);
    
    const haversine = sinDeltaLat * sinDeltaLat + 
                     Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
                     sinDeltaLon * sinDeltaLon;
    
    const anguloCentral = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
    
    return raioTerraMetros * anguloCentral;
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