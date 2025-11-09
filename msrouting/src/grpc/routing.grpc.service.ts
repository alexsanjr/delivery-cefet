import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { RoutingService } from '../routing/services/routing.service';
import {
  Point as InternalPoint,
  RouteStrategy,
  TrafficLevel,
  DeliveryPoint as InternalDeliveryPoint,
  Vehicle as InternalVehicle,
  RouteResponse,
  ETAResponse,
  OptimizedRouteResponse,
} from '../routing/dto/routing.objects';

// Interfaces para o gRPC baseadas no proto
interface Point {
  latitude: number;
  longitude: number;
}

interface RouteRequest {
  origin: Point;
  destination: Point;
  strategy: number;
  waypoints: Point[];
}

interface ETARequest {
  origin: Point;
  destination: Point;
  strategy: number;
  traffic_level: number;
}

interface DeliveryPoint {
  delivery_id: string;
  location: Point;
  service_time_seconds: number;
}

interface Vehicle {
  vehicle_id: string;
  type: string;
  capacity_kg: number;
  max_speed_kph: number;
}

interface DeliveryOptimizationRequest {
  depot: Point;
  deliveries: DeliveryPoint[];
  vehicles: Vehicle[];
}

@Controller()
export class RoutingGrpcService {
  private readonly logger = new Logger(RoutingGrpcService.name);

  constructor(private readonly routingService: RoutingService) {
    this.logger.log('🔄 RoutingGrpcService initialized');
    this.logger.log('📋 Registered gRPC methods:');
    this.logger.log('   - HealthCheck');
    this.logger.log('   - CalculateRoute');
    this.logger.log('   - CalculateETA');
    this.logger.log('   - OptimizeDeliveryRoute');
  }

  @GrpcMethod('RoutingService', 'HealthCheck')
  async healthCheck(): Promise<{ status: string }> {
    this.logger.log('📡 HealthCheck called');
    return { status: 'SERVING' };
  }

  @GrpcMethod('RoutingService', 'CalculateRoute')
  async calculateRoute(data: RouteRequest): Promise<any> {
    try {
      this.logger.log('📡 CalculateRoute called', {
        origin: data.origin,
        destination: data.destination,
        strategy: data.strategy,
      });

      if (!data.origin || !data.destination) {
        throw new RpcException({
          code: 3, // INVALID_ARGUMENT
          message: 'Origin and destination are required',
        });
      }

      // Validar coordenadas
      if (!this.isValidCoordinate(data.origin) || !this.isValidCoordinate(data.destination)) {
        throw new RpcException({
          code: 3, // INVALID_ARGUMENT
          message: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180',
        });
      }

      const route = await this.routingService.calculateRoute(
        this.mapPoint(data.origin),
        this.mapPoint(data.destination),
        this.mapRouteStrategy(data.strategy),
        data.waypoints?.map(wp => this.mapPoint(wp)) || []
      );

      return this.mapRouteResponse(route);
    } catch (error) {
      this.logger.error('CalculateRoute error:', error);
      throw new RpcException({
        code: 13, // INTERNAL
        message: `Route calculation failed: ${error.message}`,
      });
    }
  }

  @GrpcMethod('RoutingService', 'CalculateETA')
  async calculateETA(data: ETARequest): Promise<any> {
    try {
      if (!data.origin || !data.destination) {
        throw new RpcException({
          code: 3,
          message: 'Origin and destination are required',
        });
      }

      const etaResponse = await this.routingService.calculateETA(
        this.mapPoint(data.origin),
        this.mapPoint(data.destination),
        this.mapRouteStrategy(data.strategy),
        this.mapTrafficLevel(data.traffic_level)
      );

      return this.mapETAResponse(etaResponse);
    } catch (error) {
      throw new RpcException({
        code: 13,
        message: `ETA calculation failed: ${error.message}`,
      });
    }
  }

  @GrpcMethod('RoutingService', 'OptimizeDeliveryRoute')
  async optimizeDeliveryRoute(data: DeliveryOptimizationRequest): Promise<any> {
    try {
      this.logger.log('📡 OptimizeDeliveryRoute called', {
        deliveries: data.deliveries?.length || 0,
        vehicles: data.vehicles?.length || 0
      });

      if (!data.depot || !data.deliveries || data.deliveries.length === 0) {
        throw new RpcException({
          code: 3, // INVALID_ARGUMENT
          message: 'Depot and at least one delivery are required',
        });
      }

      const result = await this.routingService.optimizeDeliveryRoute(
        this.mapPoint(data.depot),
        data.deliveries.map(d => this.mapDeliveryPoint(d)),
        data.vehicles?.map(v => this.mapVehicle(v)) || []
      );

      return this.mapOptimizedRouteResponse(result);
    } catch (error) {
      this.logger.error('OptimizeDeliveryRoute error:', error);
      throw new RpcException({
        code: 13, // INTERNAL
        message: `Route optimization failed: ${error.message}`,
      });
    }
  }

  // Mappers
  private mapPoint(point: Point): InternalPoint {
    return {
      latitude: point.latitude,
      longitude: point.longitude,
    };
  }

  private mapRouteStrategy(strategy: number | string): RouteStrategy {
    // Se for string, converte para o enum correspondente
    if (typeof strategy === 'string') {
      const stringMap: { [key: string]: RouteStrategy } = {
        'STRATEGY_UNSPECIFIED': RouteStrategy.STRATEGY_UNSPECIFIED,
        'FASTEST': RouteStrategy.FASTEST,
        'SHORTEST': RouteStrategy.SHORTEST,
        'ECONOMICAL': RouteStrategy.ECONOMICAL,
        'ECO_FRIENDLY': RouteStrategy.ECO_FRIENDLY,
      };
      return stringMap[strategy] || RouteStrategy.FASTEST;
    }

    // Mapeia valores numéricos do proto para o enum interno
    const numericMap: { [key: number]: RouteStrategy } = {
      0: RouteStrategy.STRATEGY_UNSPECIFIED,
      1: RouteStrategy.FASTEST,
      2: RouteStrategy.SHORTEST,
      3: RouteStrategy.ECONOMICAL,
      4: RouteStrategy.ECO_FRIENDLY,
    };
    return numericMap[strategy] || RouteStrategy.FASTEST;
  }

  private mapTrafficLevel(level: number): TrafficLevel {
    // Mapeia valores numéricos do proto para o enum interno
    const levelMap: { [key: number]: TrafficLevel } = {
      0: TrafficLevel.TRAFFIC_UNSPECIFIED,
      1: TrafficLevel.LIGHT,
      2: TrafficLevel.MODERATE,
      3: TrafficLevel.HEAVY,
      4: TrafficLevel.EXTREME,
    };
    return levelMap[level] || TrafficLevel.MODERATE;
  }

  private mapDeliveryPoint(delivery: DeliveryPoint): InternalDeliveryPoint {
    return {
      delivery_id: delivery.delivery_id,
      location: this.mapPoint(delivery.location),
      service_time_seconds: delivery.service_time_seconds,
    };
  }

  private mapVehicle(vehicle: Vehicle): InternalVehicle {
    return {
      vehicle_id: vehicle.vehicle_id,
      type: vehicle.type,
      capacity_kg: vehicle.capacity_kg,
      max_speed_kph: vehicle.max_speed_kph,
    };
  }

  private mapRouteResponse(route: RouteResponse): any {
    return {
      path: route.path?.map(point => ({
        latitude: point.latitude,
        longitude: point.longitude,
      })) || [],
      distance_meters: route.distance_meters || 0,
      duration_seconds: route.duration_seconds || 0,
      encoded_polyline: route.encoded_polyline || '',
      steps: route.steps?.map(step => ({
        instruction: step.instruction || '',
        distance_meters: step.distance_meters || 0,
        duration_seconds: step.duration_seconds || 0,
        start_location: {
          latitude: step.start_location?.latitude || 0,
          longitude: step.start_location?.longitude || 0,
        },
        end_location: {
          latitude: step.end_location?.latitude || 0,
          longitude: step.end_location?.longitude || 0,
        },
      })) || [],
      estimated_cost: route.estimated_cost || 0,
    };
  }

  private mapETAResponse(eta: ETAResponse): any {
    return {
      eta_minutes: eta.eta_minutes || 0,
      distance_meters: eta.distance_meters || 0,
      current_traffic: eta.current_traffic || TrafficLevel.MODERATE,
    };
  }

  private mapOptimizedRouteResponse(response: OptimizedRouteResponse): any {
    return {
      vehicle_routes: response.vehicle_routes?.map(vehicleRoute => ({
        vehicle: vehicleRoute.vehicle ? this.mapVehicleToProto(vehicleRoute.vehicle) : undefined,
        assigned_deliveries: vehicleRoute.assigned_deliveries?.map(delivery => 
          this.mapDeliveryPointToProto(delivery)
        ) || [],
        route: vehicleRoute.route ? this.mapRouteResponse(vehicleRoute.route) : undefined,
      })) || [],
      total_cost: response.total_cost || 0,
      total_distance_meters: response.total_distance_meters || 0,
      total_duration_seconds: response.total_duration_seconds || 0,
    };
  }

  private mapVehicleToProto(vehicle: InternalVehicle): any {
    return {
      vehicle_id: vehicle.vehicle_id,
      type: vehicle.type,
      capacity_kg: vehicle.capacity_kg,
      max_speed_kph: vehicle.max_speed_kph,
    };
  }

  private mapDeliveryPointToProto(delivery: InternalDeliveryPoint): any {
    return {
      delivery_id: delivery.delivery_id,
      location: {
        latitude: delivery.location.latitude,
        longitude: delivery.location.longitude,
      },
      service_time_seconds: delivery.service_time_seconds,
    };
  }


  // Valida se as coordenadas estão dentro dos limites válidos da Terra
  private isValidCoordinate(point: Point): boolean {
    if (!point || typeof point.latitude !== 'number' || typeof point.longitude !== 'number') {
      return false;
    }

    // Latitude: -90 a +90
    // Longitude: -180 a +180
    return (
      point.latitude >= -90 && point.latitude <= 90 &&
      point.longitude >= -180 && point.longitude <= 180
    );
  }
}