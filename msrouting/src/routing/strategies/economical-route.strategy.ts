// src/routing/strategies/economical.strategy.ts
import { Injectable } from '@nestjs/common';
import { RouteStrategy } from './route.strategy';
import { Point, RouteResponse } from '../dto/routing.objects';
import { ExternalMapsClient } from '../../grpc/clients/external-maps.client';
import { decodePolyline } from '../utils/polyline.util';

@Injectable()
export class EconomicalRouteStrategy implements RouteStrategy {
  constructor(private mapsClient: ExternalMapsClient) {}

  async calculateRoute(origin: Point, destination: Point, waypoints: Point[] = []): Promise<RouteResponse> {
    // Por enquanto, usar apenas uma rota sem avoid para evitar erro 400
    const route = await this.mapsClient.getDirections(origin, destination, { mode: 'driving' });

    // Modifica as instruções para indicar que é rota econômica
    const economicalSteps = route.steps.map((step, index) => {
      if (index === 0) {
        return {
          ...step,
          instruction: step.instruction.replace('Siga', 'Siga pela rota mais econômica'),
        };
      }
      return step;
    });

    return {
      path: decodePolyline(route.polyline),
      distance_meters: route.distance,
      duration_seconds: route.duration,
      encoded_polyline: route.polyline,
      steps: economicalSteps,
      estimated_cost: this.getCostEstimateFromRoute(route),
    };
  }

  async calculateETA(origin: Point, destination: Point, trafficLevel: number = 1): Promise<number> {
    const route = await this.calculateRoute(origin, destination);
    return Math.floor(route.duration_seconds / 60);
  }

  getCostEstimate(route: RouteResponse): number {
    const distanceKm = route.distance_meters / 1000;
    const fuelCost = distanceKm * 0.15;
    const maintenanceCost = distanceKm * 0.02;
    const tollCost = this.hasTolls(route) ? distanceKm * 0.05 : 0;
    return fuelCost + maintenanceCost + tollCost;
  }

  private getCostEstimateFromRoute(route: any): number {
    return (route.distance / 1000) * 0.22;
  }

  private hasTolls(route: RouteResponse): boolean {
    return route.steps.some(step =>
      step.instruction.toLowerCase().includes('pedágio') ||
      step.instruction.toLowerCase().includes('toll')
    );
  }
}