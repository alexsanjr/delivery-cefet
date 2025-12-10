export interface RouteData {
  distance: number;
  duration: number;
  estimatedFee: number;
}

export interface IRoutingCalculator {
  calculateRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
  ): Promise<RouteData>;
}

export const ROUTING_CALCULATOR = Symbol('IRoutingCalculator');
