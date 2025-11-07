// src/routing/strategies/eco-friendly.strategy.ts
import { Injectable } from '@nestjs/common';
import { RouteStrategy } from './route.strategy';
import { Point, RouteResponse } from '../dto/routing.objects';
import { ExternalMapsClient } from '../../grpc/clients/external-maps.client';
import { decodePolyline } from '../utils/polyline.util';

@Injectable()
export class EcoFriendlyRouteStrategy implements RouteStrategy {
  constructor(private mapsClient: ExternalMapsClient) {}

  async calculateRoute(origin: Point, destination: Point, waypoints: Point[] = []): Promise<RouteResponse> {
    const routes = await Promise.all([
      this.mapsClient.getDirections(origin, destination, { mode: 'bicycling' }),
      this.mapsClient.getDirections(origin, destination, { mode: 'walking' }),
      this.mapsClient.getDirections(origin, destination, { mode: 'driving', avoid: ['highways'] }),
    ]);

    const bestRoute = routes.reduce((best, current) => {
      const currentEmission = this.calculateEmission(current, routes.indexOf(current));
      const bestEmission = this.calculateEmission(best, routes.indexOf(best));
      return currentEmission < bestEmission ? current : best;
    });

    const vehicleType = routes.indexOf(bestRoute) === 0 ? 'bicycle' :
                        routes.indexOf(bestRoute) === 1 ? 'walking' : 'car';

    return {
      path: decodePolyline(bestRoute.polyline),
      distance_meters: bestRoute.distance,
      duration_seconds: bestRoute.duration,
      encoded_polyline: bestRoute.polyline,
      steps: bestRoute.steps,
      estimated_cost: this.getCostEstimateForVehicle(bestRoute, vehicleType),
    };
  }

  async calculateETA(origin: Point, destination: Point, trafficLevel: number = 1): Promise<number> {
    const route = await this.calculateRoute(origin, destination);
    return Math.floor(route.duration_seconds / 60);
  }

  getCostEstimate(route: RouteResponse): number {
    const distanceKm = route.distance_meters / 1000;
    return distanceKm * 0.08;
  }

  private getCostEstimateForVehicle(route: any, vehicleType: string): number {
    const distanceKm = route.distance / 1000;
    switch (vehicleType) {
      case 'bicycle': return distanceKm * 0.02;
      case 'walking': return 0;
      default: return distanceKm * 0.08;
    }
  }

  private calculateEmission(route: any, routeIndex: number): number {
    const distanceKm = route.distance / 1000;
    const factors = { 0: 0.005, 1: 0.003, 2: 0.12 };
    return distanceKm * (factors[routeIndex] || 0.12);
  }
}