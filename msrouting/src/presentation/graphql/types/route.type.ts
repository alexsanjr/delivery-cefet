import { ObjectType, Field, Float, registerEnumType } from '@nestjs/graphql';

@ObjectType()
export class PointType {
  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;
}

@ObjectType()
export class RouteStepType {
  @Field()
  instruction: string;

  @Field(() => Float)
  distance_meters: number;

  @Field(() => Float)
  duration_seconds: number;

  @Field(() => PointType)
  start_location: PointType;

  @Field(() => PointType)
  end_location: PointType;
}

@ObjectType()
export class RouteResponseType {
  @Field(() => [PointType])
  path: PointType[];

  @Field(() => Float)
  distance_meters: number;

  @Field(() => Float)
  duration_seconds: number;

  @Field()
  encoded_polyline: string;

  @Field(() => [RouteStepType])
  steps: RouteStepType[];

  @Field(() => Float)
  estimated_cost: number;
}

@ObjectType()
export class ETAResponseType {
  @Field(() => Float)
  eta_minutes: number;

  @Field(() => Float)
  distance_meters: number;

  @Field(() => TrafficLevel)
  current_traffic: TrafficLevel;
}

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

registerEnumType(RouteStrategy, {
  name: 'RouteStrategy',
  description: 'Estratégias de cálculo de rota disponíveis',
});

registerEnumType(TrafficLevel, {
  name: 'TrafficLevel',
  description: 'Nível de tráfego atual',
});
