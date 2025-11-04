import { Injectable, Inject } from '@nestjs/common';
import { RouteStrategy, Point, RouteResponse } from '../strategies/route.strategy';
import { FastestRouteStrategy } from '../strategies/fastest-route.strategy';
import { EconomicalRouteStrategy } from '../strategies/economical-route.strategy';
import { EcoFriendlyRouteStrategy } from '../strategies/eco-friendly.strategy';
import { RouteOptimizerService } from './route-optimizer.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RoutingService {
  private strategies: Map<string, RouteStrategy> = new Map();

  constructor(
    @Inject(FastestRouteStrategy) private fastestStrategy: FastestRouteStrategy,
    @Inject(EconomicalRouteStrategy) private economicalStrategy: EconomicalRouteStrategy,
    @Inject(EcoFriendlyRouteStrategy) private ecoFriendlyStrategy: EcoFriendlyRouteStrategy,
    private routeOptimizer: RouteOptimizerService,
    private prisma: PrismaService,
  ) {
    this.strategies.set('fastest', this.fastestStrategy);
    this.strategies.set('economical', this.economicalStrategy);
    this.strategies.set('eco_friendly', this.ecoFriendlyStrategy);
  }

  async calculateRoute(
    origin: Point, 
    destination: Point, 
    strategy: string = 'fastest',
    waypoints: Point[] = []
  ): Promise<RouteResponse> {
    // Verificar cache primeiro
    const cached = await this.getCachedRoute(origin, destination, strategy);
    if (cached) {
      return cached;
    }

    const selectedStrategy = this.strategies.get(strategy) || this.fastestStrategy;
    const route = await selectedStrategy.calculateRoute(origin, destination, waypoints);
    
    await this.cacheRoute(origin, destination, strategy, route);
    
    return route;
  }

  async calculateETA(
    origin: Point,
    destination: Point,
    strategy: string = 'fastest',
    trafficLevel: number = 1
  ): Promise<number> {
    const selectedStrategy = this.strategies.get(strategy) || this.fastestStrategy;
    return selectedStrategy.calculateETA(origin, destination, trafficLevel);
  }

  async optimizeDeliveryRoute(
    depot: Point,
    deliveries: any[],
    vehicles: any[] = [{
      id: 'default',
      type: 'car',
      capacity: 10,
      speed: 40,
    }]
  ): Promise<any> {
    const optimizedRoutes = await this.routeOptimizer.solveVRP(depot, deliveries, vehicles);
    
    return {
      vehicle_routes: optimizedRoutes,
      total_cost: optimizedRoutes.reduce((sum, route) => sum + this.calculateRouteCost(route), 0),
      total_distance: optimizedRoutes.reduce((sum, route) => sum + route.total_distance, 0),
      total_duration: optimizedRoutes.reduce((sum, route) => sum + route.total_duration, 0),
    };
  }

  private calculateRouteCost(route: any): number {
    const distanceKm = route.total_distance / 1000;
    return distanceKm * 0.5; // Custo simplificado
  }

  private async getCachedRoute(
    origin: Point, 
    destination: Point, 
    strategy: string
  ): Promise<RouteResponse | null> {
    try {
      const cached = await this.prisma.routeCache.findUnique({
        where: {
          origin_lat_origin_lng_dest_lat_dest_lng_strategy: {
            origin_lat: origin.latitude,
            origin_lng: origin.longitude,
            dest_lat: destination.latitude,
            dest_lng: destination.longitude,
            strategy,
          }
        }
      });

      if (cached && cached.expires_at > new Date()) {
        return {
          path: JSON.parse(cached.polyline),
          total_distance: cached.distance,
          total_duration: cached.duration,
          polyline: cached.polyline,
          steps: [],
          cost_estimate: cached.cost_estimate,
        };
      }
    } catch (error) {
      // Se houver erro no cache, continuar sem cache
    }
    
    return null;
  }

  private async cacheRoute(
    origin: Point, 
    destination: Point, 
    strategy: string, 
    route: RouteResponse
  ): Promise<void> {
    try {
      await this.prisma.routeCache.upsert({
        where: {
          origin_lat_origin_lng_dest_lat_dest_lng_strategy: {
            origin_lat: origin.latitude,
            origin_lng: origin.longitude,
            dest_lat: destination.latitude,
            dest_lng: destination.longitude,
            strategy,
          }
        },
        update: {
          polyline: JSON.stringify(route.path),
          distance: route.total_distance,
          duration: route.total_duration,
          cost_estimate: route.cost_estimate,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        create: {
          origin_lat: origin.latitude,
          origin_lng: origin.longitude,
          dest_lat: destination.latitude,
          dest_lng: destination.longitude,
          strategy,
          polyline: JSON.stringify(route.path),
          distance: route.total_distance,
          duration: route.total_duration,
          cost_estimate: route.cost_estimate,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    } catch (error) {
      // Ignorar erros de cache
      console.warn('Failed to cache route:', error.message);
    }
  }
}