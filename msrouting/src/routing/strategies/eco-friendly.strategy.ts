import { Injectable } from '@nestjs/common';
import { RouteStrategy } from './route.strategy';
import { Point, RouteResponse } from '../dto/routing.objects';
import { ExternalMapsClient } from '../clients/external-maps.client';
import { decodePolyline } from '../utils/polyline.util';

@Injectable()
export class EcoFriendlyRouteStrategy implements RouteStrategy {
  constructor(private mapsClient: ExternalMapsClient) {}

  async calculateRoute(origin: Point, destination: Point, waypoints: Point[] = []): Promise<RouteResponse> {
    // ECO_FRIENDLY: Simula rota eco-friendly com velocidade moderada
    // Rota um pouco mais longa (+5%) e mais lenta (+25%)
    const route = await this.mapsClient.getDirections(origin, destination, { 
      mode: 'driving'
      // Nota: Simulamos o comportamento eco-friendly através dos ajustes
    });

    const ecoSteps = route.steps.map((step, index) => {
      if (index === 0) {
        return {
          ...step,
          instruction: step.instruction.replace('Siga', 'Siga pela rota eco-friendly (vias locais)'),
        };
      }
      return step;
    });

    // Rota eco-friendly: um pouco mais longa, mais lenta, mas menor emissão
    const adjustedDistance = Math.round(route.distance * 1.05); // 5% mais longa
    const adjustedDuration = Math.round(route.duration * 1.25); // 25% mais demorada (velocidade menor)

    return {
      path: decodePolyline(route.polyline),
      distance_meters: adjustedDistance,
      duration_seconds: adjustedDuration,
      encoded_polyline: route.polyline,
      steps: ecoSteps,
      estimated_cost: this.getCostEstimateEco(adjustedDistance),
    };
  }

  async calculateETA(origin: Point, destination: Point, trafficLevel: number = 1): Promise<number> {
    const route = await this.calculateRoute(origin, destination);
    return Math.floor(route.duration_seconds / 60);
  }

  getCostEstimate(route: RouteResponse): number {
    const distanceKm = route.distance_meters / 1000;
    return distanceKm * 0.08; // Custo muito baixo (sem rodovias, velocidade econômica)
  }

  private getCostEstimateEco(distanceMeters: number): number {
    const distanceKm = distanceMeters / 1000;
    // ECO_FRIENDLY: Custo médio (equilibra economia e sustentabilidade)
    return distanceKm * 0.55;
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