import { Injectable } from '@nestjs/common';
import { RouteStrategy } from './route.strategy';
import { Point, RouteResponse } from '../dto/routing.objects';
import { ExternalMapsClient } from '../../grpc/clients/external-maps.client';
import { decodePolyline } from '../utils/polyline.util';

@Injectable()
export class ShortestRouteStrategy implements RouteStrategy {
  constructor(private mapsClient: ExternalMapsClient) {}

  async calculateRoute(origin: Point, destination: Point, waypoints: Point[] = []): Promise<RouteResponse> {
    // Usar API real para rota mais curta
    const route = await this.mapsClient.getDirections(origin, destination, { mode: 'driving' });

    // Modifica as instruções para indicar que é rota mais curta
    const shortestSteps = route.steps.map((step, index) => {
      if (index === 0) {
        return {
          ...step,
          instruction: step.instruction.replace('Siga pela rota', 'Siga pela rota mais curta'),
        };
      }
      return step;
    });

    return {
      path: decodePolyline(route.polyline),
      distance_meters: route.distance,
      duration_seconds: route.duration,
      encoded_polyline: route.polyline,
      steps: shortestSteps,
      estimated_cost: this.getCostEstimate({ 
        distance_meters: route.distance, 
        duration_seconds: route.duration, 
        path: decodePolyline(route.polyline),
        encoded_polyline: route.polyline,
        steps: shortestSteps,
        estimated_cost: 0
      }),
    };
  }

  async calculateETA(origin: Point, destination: Point, trafficLevel: number = 1): Promise<number> {
    const route = await this.calculateRoute(origin, destination);
    return Math.floor(route.duration_seconds / 60);
  }

  getCostEstimate(route: RouteResponse): number {
    const distanceKm = route.distance_meters / 1000;
    // Rota mais curta pode ser mais cara por usar vias menores
    const baseCost = distanceKm * 0.45; // Menor custo por km
    const timePenalty = (route.duration_seconds / 3600) * 8; // Menos tempo = menor custo
    return baseCost + timePenalty;
  }
}