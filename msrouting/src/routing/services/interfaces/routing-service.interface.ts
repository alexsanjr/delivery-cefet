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

export interface IRoutingService {

  calculateRoute(
    origin: Point, 
    destination: Point, 
    strategy?: RouteStrategy,
    waypoints?: Point[]
  ): Promise<RouteResponse>;


  calculateETA(
    origin: Point,
    destination: Point,
    strategy?: RouteStrategy,
    trafficLevel?: TrafficLevel
  ): Promise<ETAResponse>;

  optimizeDeliveryRoute(
    depot: Point,
    deliveries: DeliveryPoint[],
    vehicles?: Vehicle[]
  ): Promise<OptimizedRouteResponse>;
}
