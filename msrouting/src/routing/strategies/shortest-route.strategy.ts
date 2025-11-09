import { Injectable } from '@nestjs/common';
import { RouteStrategy } from './route.strategy';
import { Point, RouteResponse } from '../dto/routing.objects';
import { ExternalMapsClient } from '../clients/external-maps.client';
import { decodePolyline } from '../utils/polyline.util';

@Injectable()
export class ShortestRouteStrategy implements RouteStrategy {
  constructor(private mapsClient: ExternalMapsClient) {}

  async calculateRoute(origin: Point, destination: Point, waypoints: Point[] = []): Promise<RouteResponse> {
    const route = await this.mapsClient.getDirections(origin, destination, { mode: 'driving' });

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
      distance_meters: Math.round(route.distance),
      duration_seconds: Math.round(route.duration),
      encoded_polyline: route.polyline,
      steps: shortestSteps,
      estimated_cost: this.getCostEstimate({ 
        distance_meters: Math.round(route.distance), 
        duration_seconds: Math.round(route.duration), 
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
    const baseCost = distanceKm * 0.45;
    const timePenalty = (route.duration_seconds / 3600) * 8;
    return baseCost + timePenalty;
  }
}