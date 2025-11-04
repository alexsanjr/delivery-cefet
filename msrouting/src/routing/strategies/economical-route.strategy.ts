import { Injectable } from '@nestjs/common';
import { RouteStrategy, Point, RouteResponse } from './route.strategy';
import { ExternalMapsClient } from '../../grpc/clients/external-maps.client';

@Injectable()
export class EconomicalRouteStrategy implements RouteStrategy {
  constructor(private mapsClient: ExternalMapsClient) {}

  async calculateRoute(origin: Point, destination: Point, waypoints: Point[] = []): Promise<RouteResponse> {
    const routes = await Promise.all([
      this.mapsClient.getDirections(origin, destination, { mode: 'driving' }),
      this.mapsClient.getDirections(origin, destination, { mode: 'driving', avoid: ['highways'] }),
      this.mapsClient.getDirections(origin, destination, { mode: 'driving', avoid: ['tolls'] }),
    ]);

    const bestRoute = routes.reduce((best, current) => {
      const currentCost = this.getCostEstimateFromRoute(current);
      const bestCost = this.getCostEstimateFromRoute(best);
      return currentCost < bestCost ? current : best;
    });

    return {
      path: this.decodePolyline(bestRoute.polyline),
      total_distance: bestRoute.distance,
      total_duration: bestRoute.duration,
      polyline: bestRoute.polyline,
      steps: bestRoute.steps,
      cost_estimate: this.getCostEstimateFromRoute(bestRoute),
    };
  }

  async calculateETA(origin: Point, destination: Point, trafficLevel: number = 1): Promise<number> {
    const route = await this.calculateRoute(origin, destination);
    return Math.floor(route.total_duration / 60);
  }

  getCostEstimate(route: RouteResponse): number {
    const distanceKm = route.total_distance / 1000;
    
    // Custos mais detalhados para estratégia econômica
    const fuelCost = distanceKm * 0.15;
    const maintenanceCost = distanceKm * 0.02;
    const tollCost = this.hasTolls(route) ? distanceKm * 0.05 : 0;
    
    return fuelCost + maintenanceCost + tollCost;
  }

  private getCostEstimateFromRoute(route: any): number {
    const distanceKm = route.distance / 1000;
    return distanceKm * 0.22;
  }

  private hasTolls(route: RouteResponse): boolean {
    return route.steps.some(step => 
      step.instruction.toLowerCase().includes('pedágio') || 
      step.instruction.toLowerCase().includes('toll')
    );
  }

  private decodePolyline(polyline: string): Point[] {
    // Reutilizar mesma implementação do fastest-route
    const points: Point[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < polyline.length) {
      let b, shift = 0, result = 0;
      
      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat * 1e-5,
        longitude: lng * 1e-5,
      });
    }

    return points;
  }
}