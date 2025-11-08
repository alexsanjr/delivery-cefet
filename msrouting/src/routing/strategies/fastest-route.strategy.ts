import { Injectable } from '@nestjs/common';
import { RouteStrategy } from './route.strategy';
import { Point, RouteResponse } from '../dto/routing.objects';
import { ExternalMapsClient } from '../../grpc/clients/external-maps.client';
import { decodePolyline } from '../utils/polyline.util';

@Injectable()
export class FastestRouteStrategy implements RouteStrategy {
  constructor(private mapsClient: ExternalMapsClient) {}

  async calculateRoute(origin: Point, destination: Point, waypoints: Point[] = []): Promise<RouteResponse> {
    const route = await this.mapsClient.getDirections(origin, destination, { mode: 'driving' });

    // Modifica as instruções para indicar que é rota mais rápida
    const fastestSteps = route.steps.map((step, index) => {
      if (index === 0) {
        return {
          ...step,
          instruction: step.instruction.replace('Siga pela rota', 'Siga pela rota mais rápida'),
        };
      }
      return step;
    });

    return {
      path: decodePolyline(route.polyline),
      distance_meters: route.distance,
      duration_seconds: route.duration,
      encoded_polyline: route.polyline,
      steps: fastestSteps,
      estimated_cost: this.getCostEstimate({ 
        distance_meters: route.distance, 
        duration_seconds: route.duration, 
        path: decodePolyline(route.polyline),
        encoded_polyline: route.polyline,
        steps: fastestSteps,
        estimated_cost: 0
      }),
    };
  }

  async calculateETA(origin: Point, destination: Point, trafficLevel: number = 1): Promise<number> {
    const route = await this.calculateRoute(origin, destination);
    const multiplier = this.getTrafficMultiplier(trafficLevel);
    return Math.floor((route.duration_seconds * multiplier) / 60);
  }

  getCostEstimate(route: RouteResponse): number {
    const km = route.distance_meters / 1000;
    const hours = route.duration_seconds / 3600;
    return km * 0.5 + hours * 12;
  }

  private getCostEstimateFromResponse(route: any): number {
    return (route.distance / 1000) * 0.5;
  }

  private getTrafficMultiplier(level: number): number {
    const map: { [key: number]: number } = { 1: 1.0, 2: 1.2, 3: 1.5, 4: 2.0 };
    return map[level] || 1.0;
  }

  private haversineDistance(point1: Point, point2: Point): number {
    const R = 6371000;
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Gera pontos intermediários mais realistas para a rota
   */
  private generateRoutePoints(origin: Point, destination: Point): Point[] {
    const points: Point[] = [origin];
    
    // Adicionar 3-5 pontos intermediários
    const numPoints = 4;
    for (let i = 1; i < numPoints; i++) {
      const ratio = i / numPoints;
      
      // Adicionar pequena variação para simular uma rota real
      const variation = 0.002 * (Math.random() - 0.5); // ~200m de variação
      
      points.push({
        latitude: origin.latitude + (destination.latitude - origin.latitude) * ratio + variation,
        longitude: origin.longitude + (destination.longitude - origin.longitude) * ratio + variation,
      });
    }
    
    points.push(destination);
    return points;
  }
}