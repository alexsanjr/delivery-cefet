import { Injectable } from '@nestjs/common';
import { RouteStrategy, Point, RouteResponse } from './route.strategy';
import { ExternalMapsClient } from '../../grpc/clients/external-maps.client';

@Injectable()
export class FastestRouteStrategy implements RouteStrategy {
  constructor(private mapsClient: ExternalMapsClient) {}

  async calculateRoute(origin: Point, destination: Point, waypoints: Point[] = []): Promise<RouteResponse> {
    const route = await this.mapsClient.getDirections(origin, destination, {
      waypoints,
      mode: 'driving',
      optimize: true,
    });

    return {
      path: this.decodePolyline(route.polyline),
      total_distance: route.distance,
      total_duration: route.duration,
      polyline: route.polyline,
      steps: route.steps,
      cost_estimate: this.getCostEstimateFromRoute(route),
    };
  }

  async calculateETA(origin: Point, destination: Point, trafficLevel: number = 1): Promise<number> {
    const route = await this.calculateRoute(origin, destination);
    const trafficMultiplier = this.getTrafficMultiplier(trafficLevel);
    return Math.floor(route.total_duration / 60 * trafficMultiplier);
  }

  getCostEstimate(route: RouteResponse): number {
    const distanceKm = route.total_distance / 1000;
    const timeHours = route.total_duration / 3600;
    
    const distanceCost = distanceKm * 0.5;
    const timeCost = timeHours * 12;
    
    return distanceCost + timeCost;
  }

  private getCostEstimateFromRoute(route: any): number {
    const distanceKm = route.distance / 1000;
    return distanceKm * 0.5;
  }

  private getTrafficMultiplier(trafficLevel: number): number {
    const multipliers = { 1: 1.0, 2: 1.2, 3: 1.5, 4: 2.0, 5: 3.0 };
    return multipliers[trafficLevel] || 1.0;
  }

  private decodePolyline(polyline: string): Point[] {
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