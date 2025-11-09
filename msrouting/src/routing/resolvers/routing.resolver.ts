import { Resolver, Query, Args } from '@nestjs/graphql';
import { RoutingService } from '../services/routing.service';
import { PointInput } from '../dto/point.input';
import { RouteResponseType, ETAResponseType } from '../dto/route.types';
import { RouteStrategy, TrafficLevel, Point } from '../dto/routing.objects';

@Resolver()
export class RoutingResolver {
  constructor(private readonly routingService: RoutingService) {}

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
      description: 'Estratégia de cálculo de rota' 
    })
    strategy: RouteStrategy = RouteStrategy.FASTEST,
    
    @Args('waypoints', { 
      type: () => [PointInput], 
      nullable: true, 
      defaultValue: [],
      description: 'Pontos intermediários (waypoints)' 
    })
    waypoints: PointInput[] = [],
  ): Promise<RouteResponseType> {
    const originPoint: Point = { 
      latitude: origin.latitude, 
      longitude: origin.longitude 
    };
    
    const destinationPoint: Point = { 
      latitude: destination.latitude, 
      longitude: destination.longitude 
    };
    
    const waypointPoints: Point[] = waypoints.map(wp => ({ 
      latitude: wp.latitude, 
      longitude: wp.longitude 
    }));

    const result = await this.routingService.calculateRoute(
      originPoint,
      destinationPoint,
      strategy,
      waypointPoints
    );
    
    return result;
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
      description: 'Estratégia de cálculo de rota' 
    })
    strategy: RouteStrategy = RouteStrategy.FASTEST,
    
    @Args('trafficLevel', { 
      type: () => TrafficLevel, 
      nullable: true, 
      defaultValue: TrafficLevel.MODERATE,
      description: 'Nível de tráfego atual' 
    })
    trafficLevel: TrafficLevel = TrafficLevel.MODERATE,
  ): Promise<ETAResponseType> {
    const originPoint: Point = { 
      latitude: origin.latitude, 
      longitude: origin.longitude 
    };
    
    const destinationPoint: Point = { 
      latitude: destination.latitude, 
      longitude: destination.longitude 
    };

    const result = await this.routingService.calculateETA(
      originPoint,
      destinationPoint,
      strategy,
      trafficLevel
    );
    
    return result;
  }
}
