import { ObjectType, Field, Float, Int, registerEnumType } from '@nestjs/graphql';
import { RouteStrategy, TrafficLevel } from './routing.objects';

registerEnumType(RouteStrategy, {
  name: 'RouteStrategy',
  description: 'Estratégias de cálculo de rota disponíveis',
  valuesMap: {
    STRATEGY_UNSPECIFIED: { description: 'Estratégia não especificada' },
    FASTEST: { description: 'Rota mais rápida' },
    SHORTEST: { description: 'Rota mais curta' },
    ECONOMICAL: { description: 'Rota mais econômica' },
    ECO_FRIENDLY: { description: 'Rota mais sustentável' },
  },
});

registerEnumType(TrafficLevel, {
  name: 'TrafficLevel',
  description: 'Nível de tráfego atual',
  valuesMap: {
    TRAFFIC_UNSPECIFIED: { description: 'Tráfego não especificado' },
    LIGHT: { description: 'Tráfego leve' },
    MODERATE: { description: 'Tráfego moderado' },
    HEAVY: { description: 'Tráfego pesado' },
    EXTREME: { description: 'Tráfego extremo' },
  },
});

@ObjectType()
export class PointType {
  @Field(() => Float, { description: 'Latitude da localização' })
  latitude: number;

  @Field(() => Float, { description: 'Longitude da localização' })
  longitude: number;
}

@ObjectType()
export class RouteStepType {
  @Field(() => String, { description: 'Instrução de navegação' })
  instruction: string;

  @Field(() => Int, { description: 'Distância em metros' })
  distance_meters: number;

  @Field(() => Int, { description: 'Duração em segundos' })
  duration_seconds: number;

  @Field(() => PointType, { description: 'Localização inicial' })
  start_location: PointType;

  @Field(() => PointType, { description: 'Localização final' })
  end_location: PointType;
}

@ObjectType()
export class RouteResponseType {
  @Field(() => [PointType], { description: 'Pontos do caminho' })
  path: PointType[];

  @Field(() => Int, { description: 'Distância total em metros' })
  distance_meters: number;

  @Field(() => Int, { description: 'Duração total em segundos' })
  duration_seconds: number;

  @Field(() => String, { description: 'Polyline codificado para mapas' })
  encoded_polyline: string;

  @Field(() => [RouteStepType], { description: 'Passos detalhados da rota' })
  steps: RouteStepType[];

  @Field(() => Float, { description: 'Custo estimado da rota em reais' })
  estimated_cost: number;
}

@ObjectType()
export class ETAResponseType {
  @Field(() => Int, { description: 'Tempo estimado de chegada em minutos' })
  eta_minutes: number;

  @Field(() => Int, { description: 'Distância total em metros' })
  distance_meters: number;

  @Field(() => TrafficLevel, { description: 'Nível de tráfego atual' })
  current_traffic: TrafficLevel;
}
