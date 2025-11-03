import { Injectable } from '@nestjs/common';
import { RouteStrategy, Point, RouteResponse } from './route.strategy';
import { ExternalMapsClient } from '../../grpc/clients/external-maps.client';

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
      path: this.decodePolyline(bestRoute.polyline),
      total_distance: bestRoute.distance,
      total_duration: bestRoute.duration,
      polyline: bestRoute.polyline,
      steps: bestRoute.steps,
      cost_estimate: this.getCostEstimateForVehicle(bestRoute, vehicleType),
    };
  }

  async calculateETA(origin: Point, destination: Point, trafficLevel: number = 1): Promise<number> {
    const route = await this.calculateRoute(origin, destination);
    return Math.floor(route.total_duration / 60);
  }

  getCostEstimate(route: RouteResponse): number {
    // Custo base para estratégia ecológica
    const distanceKm = route.total_distance / 1000;
    return distanceKm * 0.08; // Custo reduzido para veículos ecológicos
  }

  private getCostEstimateForVehicle(route: any, vehicleType: string): number {
    const distanceKm = route.distance / 1000;
    
    switch (vehicleType) {
      case 'bicycle':
        return distanceKm * 0.02;
      case 'walking':
        return 0;
      case 'car':
      default:
        return distanceKm * 0.08;
    }
  }

  private calculateEmission(route: any, routeIndex: number): number {
    const distanceKm = route.distance / 1000;
    const emissionFactors = {
      0: 0.005, // bicycle
      1: 0.003, // walking
      2: 0.12,  // car (eficiente)
    };
    
    return distanceKm * (emissionFactors[routeIndex] || 0.12);
  }

  private decodePolyline(polyline: string): Point[] {
    // Reutilizar implementação
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