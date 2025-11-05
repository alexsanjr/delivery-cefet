import { Point, RouteStep, RouteResponse } from '../dto/routing.objects';

export abstract class RouteStrategy {
  abstract calculateRoute(
    origin: Point,
    destination: Point,
    waypoints?: Point[],
  ): Promise<RouteResponse>;
  
  abstract calculateETA(
    origin: Point,
    destination: Point,
    trafficLevel?: number,
  ): Promise<number>;
  
  abstract getCostEstimate(route: RouteResponse): number;
}