export enum RouteStrategy {
  STRATEGY_UNSPECIFIED = 0,
  FASTEST = 1,
  SHORTEST = 2,
  ECONOMICAL = 3,
  ECO_FRIENDLY = 4,
}

export enum TrafficLevel {
  TRAFFIC_UNSPECIFIED = 0,
  LIGHT = 1,
  MODERATE = 2,
  HEAVY = 3,
  EXTREME = 4,
}

// === DTOs ===
export class Point {
  latitude: number;
  longitude: number;
}

export class RouteStep {
  instruction: string;
  distance_meters: number;
  duration_seconds: number;
  start_location: Point;
  end_location: Point;
}

export class RouteResponse {
  path: Point[];
  distance_meters: number;
  duration_seconds: number;
  encoded_polyline: string;
  steps: RouteStep[];
  estimated_cost: number;
}

export class ETAResponse {
  eta_minutes: number;
  distance_meters: number;
  current_traffic: TrafficLevel;
}

export class DeliveryPoint {
  delivery_id: string;
  location: Point;
  service_time_seconds: number;
}

export class Vehicle {
  vehicle_id: string;
  type: string;
  capacity_kg: number;
  max_speed_kph: number;
}

export class VehicleRoute {
  vehicle: Vehicle;
  assigned_deliveries: DeliveryPoint[];
  route: RouteResponse;
}

export class OptimizedRouteResponse {
  vehicle_routes: VehicleRoute[];
  total_cost: number;
  total_distance_meters: number;
  total_duration_seconds: number;
}