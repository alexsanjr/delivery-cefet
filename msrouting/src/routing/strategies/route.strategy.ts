export interface Point {
  latitude: number;
  longitude: number;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  start_location: Point;
  end_location: Point;
}

export interface RouteResponse {
  path: Point[];
  total_distance: number;
  total_duration: number;
  polyline: string;
  steps: RouteStep[];
  cost_estimate: number;
}

export abstract class RouteStrategy {
  abstract calculateRoute(origin: Point, destination: Point, waypoints?: Point[]): Promise<RouteResponse>;
  abstract calculateETA(origin: Point, destination: Point, trafficLevel?: number): Promise<number>;
  abstract getCostEstimate(route: RouteResponse): number;
}