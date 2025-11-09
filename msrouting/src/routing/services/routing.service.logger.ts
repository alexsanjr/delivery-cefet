import { Injectable, Logger, Inject } from '@nestjs/common';
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
import type { IRoutingService } from './interfaces/routing-service.interface';

@Injectable()
export class RoutingServiceLogger implements IRoutingService {
  private readonly logger = new Logger('RoutingService');

  constructor(
    @Inject('IRoutingService.Base')
    private readonly routingService: IRoutingService,
  ) {}

  async calculateRoute(
    origin: Point, 
    destination: Point, 
    strategy: RouteStrategy = RouteStrategy.FASTEST,
    waypoints: Point[] = []
  ): Promise<RouteResponse> {
    this.logger.log(
      `🗺️  Calculando rota: (${origin.latitude}, ${origin.longitude}) → (${destination.latitude}, ${destination.longitude}) | Estratégia: ${RouteStrategy[strategy]} | Waypoints: ${waypoints.length}`
    );
    const startTime = Date.now();
    
    try {
      const route = await this.routingService.calculateRoute(origin, destination, strategy, waypoints);
      const duration = Date.now() - startTime;
      
      this.logger.log(
        `✅ Rota calculada em ${duration}ms | Distância: ${route.distance_meters}m (${(route.distance_meters / 1000).toFixed(2)}km) | ` +
        `Duração: ${route.duration_seconds}s (${Math.ceil(route.duration_seconds / 60)}min) | ` +
        `Custo: R$${route.estimated_cost.toFixed(2)} | ` +
        `Passos: ${route.steps.length}`
      );
      
      return route;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ Erro ao calcular rota após ${duration}ms | Estratégia: ${RouteStrategy[strategy]}`,
        error.stack
      );
      throw error;
    }
  }

  async calculateETA(
    origin: Point,
    destination: Point,
    strategy: RouteStrategy = RouteStrategy.FASTEST,
    trafficLevel: TrafficLevel = TrafficLevel.MODERATE
  ): Promise<ETAResponse> {
    this.logger.log(
      `⏱️  Calculando ETA: (${origin.latitude}, ${origin.longitude}) → (${destination.latitude}, ${destination.longitude}) | ` +
      `Tráfego: ${TrafficLevel[trafficLevel]} | Estratégia: ${RouteStrategy[strategy]}`
    );
    const startTime = Date.now();
    
    try {
      const eta = await this.routingService.calculateETA(origin, destination, strategy, trafficLevel);
      const duration = Date.now() - startTime;
      
      this.logger.log(
        `✅ ETA calculado em ${duration}ms | ETA: ${eta.eta_minutes}min | ` +
        `Distância: ${eta.distance_meters}m (${(eta.distance_meters / 1000).toFixed(2)}km) | ` +
        `Tráfego atual: ${TrafficLevel[eta.current_traffic]}`
      );
      
      return eta;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ Erro ao calcular ETA após ${duration}ms | Tráfego: ${TrafficLevel[trafficLevel]}`,
        error.stack
      );
      throw error;
    }
  }

  async optimizeDeliveryRoute(
    depot: Point,
    deliveries: DeliveryPoint[],
    vehicles: Vehicle[] = []
  ): Promise<OptimizedRouteResponse> {
    this.logger.log(
      `📦 Otimizando rota de entrega | Depot: (${depot.latitude}, ${depot.longitude}) | ` +
      `Entregas: ${deliveries.length} | Veículos: ${vehicles.length || 1}`
    );
    const startTime = Date.now();
    
    try {
      const optimized = await this.routingService.optimizeDeliveryRoute(depot, deliveries, vehicles);
      const duration = Date.now() - startTime;
      
      this.logger.log(
        `✅ Rota otimizada em ${duration}ms | Veículos usados: ${optimized.vehicle_routes.length} | ` +
        `Distância total: ${optimized.total_distance_meters}m (${(optimized.total_distance_meters / 1000).toFixed(2)}km) | ` +
        `Duração total: ${optimized.total_duration_seconds}s (${Math.ceil(optimized.total_duration_seconds / 60)}min) | ` +
        `Custo total: R$${optimized.total_cost.toFixed(2)}`
      );
      
      optimized.vehicle_routes.forEach((vr, index) => {
        this.logger.debug(
          `   📍 Veículo ${index + 1} (${vr.vehicle.vehicle_id}): ${vr.assigned_deliveries.length} entregas | ` +
          `${vr.route.distance_meters}m | ${Math.ceil(vr.route.duration_seconds / 60)}min`
        );
      });
      
      return optimized;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ Erro ao otimizar rota de entrega após ${duration}ms | Entregas: ${deliveries.length}`,
        error.stack
      );
      throw error;
    }
  }
}
