// src/routing/dto/routing.objects.ts
import { Field, ObjectType, Float, Int, InputType } from '@nestjs/graphql';

@ObjectType()
@InputType('PointInput')
export class Point {
  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;
}

@ObjectType()
export class RouteStep {
  @Field()
  instruction: string;

  @Field(() => Int)
  distance: number;

  @Field(() => Int)
  duration: number;

  @Field(() => Point)
  start_location: Point;

  @Field(() => Point)
  end_location: Point;
}

@ObjectType()
export class RouteResponse {
  @Field(() => [Point])
  path: Point[];

  @Field(() => Int)
  total_distance: number;

  @Field(() => Int)
  total_duration: number;

  @Field()
  polyline: string;

  @Field(() => [RouteStep])
  steps: RouteStep[];

  @Field(() => Float)
  cost_estimate: number;
}

@ObjectType()
export class ETAResponse {
  @Field(() => Int)
  eta_minutes: number;

  @Field(() => Int)
  distance_meters: number;

  @Field()
  traffic_condition: string;
}

@ObjectType()
@InputType('DeliveryPointInput')
export class DeliveryPoint {
  @Field()
  delivery_id: string;

  @Field(() => Point)
  location: Point;

  @Field(() => Int)
  estimated_service_time: number;
}

@ObjectType()
@InputType('VehicleInput')
export class Vehicle {
  @Field()
  id: string;

  @Field()
  type: string;

  @Field(() => Float)
  capacity: number;

  @Field(() => Float)
  speed: number;
}

@ObjectType()
export class VehicleRoute {
  @Field(() => Vehicle)
  vehicle: Vehicle;

  @Field(() => [DeliveryPoint])
  deliveries: DeliveryPoint[];

  @Field(() => RouteResponse)
  route: RouteResponse;
}

@ObjectType()
export class OptimizedRouteResponse {
  @Field(() => [VehicleRoute])
  vehicle_routes: VehicleRoute[];

  @Field(() => Float)
  total_cost: number;

  @Field(() => Float)
  total_duration: number;

  @Field(() => Float)
  total_distance: number;
}