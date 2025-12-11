import { Resolver, Query, Args } from '@nestjs/graphql';
import { CalcularRotaCasoDeUso } from '../../../application/use-cases/calcular-rota.use-case';
import { CalcularETACasoDeUso } from '../../../application/use-cases/calcular-eta.use-case';
import { EstrategiaRota } from '../../../domain/entities/rota.entity';
import { PointInput } from '../inputs/point.input';
import { RouteResponseType, ETAResponseType, RouteStrategy, TrafficLevel } from '../types/route.type';

// Expõe queries GraphQL para cálculo de rotas
@Resolver()
export class RoutingResolver {
  constructor(
    private readonly calcularRotaCasoDeUso: CalcularRotaCasoDeUso,
    private readonly calcularETACasoDeUso: CalcularETACasoDeUso,
  ) {}

  @Query(() => RouteResponseType, {
    name: 'calculateRoute',
    description: 'Calcula a melhor rota entre dois pontos usando a estratégia especificada',
  })
  async calculateRoute(
    @Args('origin', { type: () => PointInput, description: 'Ponto de origem' })
    origin: PointInput,

    @Args('destination', { type: () => PointInput, description: 'Ponto de destino' })
    destination: PointInput,

    @Args('strategy', {
      type: () => RouteStrategy,
      nullable: true,
      defaultValue: RouteStrategy.FASTEST,
      description: 'Estratégia de cálculo de rota',
    })
    strategy: RouteStrategy = RouteStrategy.FASTEST,

    @Args('waypoints', {
      type: () => [PointInput],
      nullable: true,
      defaultValue: [],
      description: 'Pontos intermediários (waypoints)',
    })
    waypoints: PointInput[] = [],
  ): Promise<RouteResponseType> {
    // Mapear estratégia GraphQL para domain
    const estrategiaDomain = this.mapearEstrategia(strategy);

    const rota = await this.calcularRotaCasoDeUso.executar({
      origemLatitude: origin.latitude,
      origemLongitude: origin.longitude,
      destinoLatitude: destination.latitude,
      destinoLongitude: destination.longitude,
      pontosIntermediarios: waypoints,
      estrategia: estrategiaDomain,
    });

    // Converter para formato GraphQL
    return {
      path: [
        { latitude: rota.origem.latitude, longitude: rota.origem.longitude },
        { latitude: rota.destino.latitude, longitude: rota.destino.longitude },
      ],
      distance_meters: rota.distanciaMetros,
      duration_seconds: rota.duracaoSegundos,
      encoded_polyline: rota.polyline,
      steps: rota.passos.map((passo) => ({
        instruction: passo.instrucao,
        distance_meters: passo.distanciaMetros,
        duration_seconds: passo.duracaoSegundos,
        start_location: passo.pontoInicio,
        end_location: passo.pontoFim,
      })),
      estimated_cost: rota.custoEstimado,
    };
  }

  @Query(() => ETAResponseType, {
    name: 'calculateETA',
    description: 'Calcula o tempo estimado de chegada (ETA) entre dois pontos',
  })
  async calculateETA(
    @Args('origin', { type: () => PointInput, description: 'Ponto de origem' })
    origin: PointInput,

    @Args('destination', { type: () => PointInput, description: 'Ponto de destino' })
    destination: PointInput,

    @Args('strategy', {
      type: () => RouteStrategy,
      nullable: true,
      defaultValue: RouteStrategy.FASTEST,
      description: 'Estratégia de cálculo de rota',
    })
    strategy: RouteStrategy = RouteStrategy.FASTEST,

    @Args('trafficLevel', {
      type: () => TrafficLevel,
      nullable: true,
      defaultValue: TrafficLevel.MODERATE,
      description: 'Nível de tráfego atual',
    })
    trafficLevel: TrafficLevel = TrafficLevel.MODERATE,
  ): Promise<ETAResponseType> {
    const estrategiaDomain = this.mapearEstrategia(strategy);

    const eta = await this.calcularETACasoDeUso.executar({
      origemLatitude: origin.latitude,
      origemLongitude: origin.longitude,
      destinoLatitude: destination.latitude,
      destinoLongitude: destination.longitude,
    });

    return {
      eta_minutes: eta.etaMinutos,
      distance_meters: eta.distanciaMetros,
      current_traffic: trafficLevel,
    };
  }

  private mapearEstrategia(strategy: RouteStrategy): EstrategiaRota {
    switch (strategy) {
      case RouteStrategy.FASTEST:
        return EstrategiaRota.MAIS_RAPIDA;
      case RouteStrategy.SHORTEST:
        return EstrategiaRota.MAIS_CURTA;
      case RouteStrategy.ECONOMICAL:
        return EstrategiaRota.MAIS_ECONOMICA;
      case RouteStrategy.ECO_FRIENDLY:
        return EstrategiaRota.ECO_FRIENDLY;
      default:
        return EstrategiaRota.MAIS_RAPIDA;
    }
  }
}
