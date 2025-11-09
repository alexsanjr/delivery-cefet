import { Injectable } from '@nestjs/common';
import { RouteStrategy } from './route.strategy';
import { Point, RouteResponse } from '../dto/routing.objects';
import { ExternalMapsClient } from '../clients/external-maps.client';
import { decodePolyline } from '../utils/polyline.util';

@Injectable()
export class EconomicalRouteStrategy implements RouteStrategy {
  constructor(private mapsClient: ExternalMapsClient) {}

  async calculateRoute(origin: Point, destination: Point, waypoints: Point[] = []): Promise<RouteResponse> {
    // ECONOMICAL: Simula rota que evita pedágios e rodovias
    // Rota mais longa (+8%) e mais lenta (+15%), mas com menor custo
    const route = await this.mapsClient.getDirections(origin, destination, { 
      mode: 'driving'
      // Nota: Simulamos o comportamento de evitar pedágios através dos ajustes
    });

    console.log('🔴 ECONOMICAL - Valores DA API:', {
      distance: route.distance,
      duration: route.duration
    });

    const economicalSteps = route.steps.map((step, index) => {
      if (index === 0) {
        return {
          ...step,
          instruction: step.instruction.replace('Siga', 'Siga pela rota mais econômica (evita pedágios)'),
        };
      }
      return step;
    });

    // Rota econômica pode ser um pouco mais longa, mas mais barata
    const adjustedDistance = Math.round(route.distance * 1.08); // 8% mais longa
    const adjustedDuration = Math.round(route.duration * 1.15); // 15% mais demorada (vias menores)

    console.log('🟢 ECONOMICAL - Valores AJUSTADOS:', {
      distance: adjustedDistance,
      duration: adjustedDuration,
      multiplicadores: '1.08 e 1.15'
    });

    return {
      path: decodePolyline(route.polyline),
      distance_meters: adjustedDistance,
      duration_seconds: adjustedDuration,
      encoded_polyline: route.polyline,
      steps: economicalSteps,
      estimated_cost: this.getCostEstimateFromDistance(adjustedDistance),
    };
  }

  async calculateETA(origin: Point, destination: Point, trafficLevel: number = 1): Promise<number> {
    const route = await this.calculateRoute(origin, destination);
    return Math.floor(route.duration_seconds / 60);
  }

  getCostEstimate(route: RouteResponse): number {
    const distanceKm = route.distance_meters / 1000;
    const fuelCost = distanceKm * 0.15; // Combustível mais barato (vias sem pedágio)
    const maintenanceCost = distanceKm * 0.02;
    const tollCost = this.hasTolls(route) ? distanceKm * 0.05 : 0;
    return fuelCost + maintenanceCost + tollCost;
  }

  private getCostEstimateFromRoute(route: any): number {
    return (route.distance / 1000) * 0.22; // Custo reduzido (sem pedágios)
  }

  private getCostEstimateFromDistance(distanceMeters: number): number {
    const distanceKm = distanceMeters / 1000;
    // ECONOMICAL: Custo mais baixo (evita pedágios e rodovias)
    return distanceKm * 0.40;
  }

  private hasTolls(route: RouteResponse): boolean {
    return route.steps.some(step =>
      step.instruction.toLowerCase().includes('pedágio') ||
      step.instruction.toLowerCase().includes('toll')
    );
  }
}