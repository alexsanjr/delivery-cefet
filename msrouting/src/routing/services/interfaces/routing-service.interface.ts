import { 
  RouteStrategy, 
  Point, 
  RouteResponse, 
  TrafficLevel, 
  ETAResponse, 
  DeliveryPoint, 
  Vehicle, 
  OptimizedRouteResponse 
} from '../../dto/routing.objects';

/**
 * Interface IRoutingService
 * 
 * Define o contrato para serviços de roteamento.
 * Permite implementação de Decorator Pattern para logging.
 * 
 * SOLID Principles:
 * - Dependency Inversion Principle (D): Código depende da abstração, não da implementação
 * - Interface Segregation Principle (I): Interface focada em operações de roteamento
 */
export interface IRoutingService {
  /**
   * Calcula uma rota entre origem e destino usando a estratégia especificada
   */
  calculateRoute(
    origin: Point, 
    destination: Point, 
    strategy?: RouteStrategy,
    waypoints?: Point[]
  ): Promise<RouteResponse>;

  /**
   * Calcula o tempo estimado de chegada (ETA)
   */
  calculateETA(
    origin: Point,
    destination: Point,
    strategy?: RouteStrategy,
    trafficLevel?: TrafficLevel
  ): Promise<ETAResponse>;

  /**
   * Otimiza rotas de entrega para múltiplos pontos
   */
  optimizeDeliveryRoute(
    depot: Point,
    deliveries: DeliveryPoint[],
    vehicles?: Vehicle[]
  ): Promise<OptimizedRouteResponse>;
}
