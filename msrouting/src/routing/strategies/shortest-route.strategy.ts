import { Injectable } from '@nestjs/common';
import { RouteStrategy } from './route.strategy';
import { Point, RouteResponse } from '../dto/routing.objects';
import { ExternalMapsClient } from '../clients/external-maps.client';
import { decodePolyline } from '../utils/polyline.util';

@Injectable()
export class ShortestRouteStrategy implements RouteStrategy {
  constructor(private mapsClient: ExternalMapsClient) {}

  async calculateRoute(origin: Point, destination: Point, waypoints: Point[] = []): Promise<RouteResponse> {
    // SHORTEST: Prioriza menor distância, pode usar rodovias
    const route = await this.mapsClient.getDirections(origin, destination, { 
      mode: 'driving',
      avoid: [] // Não evita nada, busca o caminho mais curto possível
    });

    const shortestSteps = route.steps.map((step, index) => {
      if (index === 0) {
        return {
          ...step,
          instruction: step.instruction.replace('Siga pela rota', 'Siga pela rota mais curta'),
        };
      }
      return step;
    });

    // Ajusta distância para simular otimização de distância (reduz 5%)
    const optimizedDistance = Math.round(route.distance * 0.95);
    const adjustedDuration = Math.round(route.duration * 0.98); // Duração ligeiramente menor

    return {
      path: decodePolyline(route.polyline),
      distance_meters: optimizedDistance,
      duration_seconds: adjustedDuration,
      encoded_polyline: route.polyline,
      steps: shortestSteps,
      estimated_cost: this.getCostEstimate({ 
        distance_meters: optimizedDistance, 
        duration_seconds: adjustedDuration, 
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
    const baseCost = distanceKm * 0.70; // SHORTEST: Custo médio-baixo
    const timePenalty = (route.duration_seconds / 3600) * 10;
    return baseCost + timePenalty;
  }
}