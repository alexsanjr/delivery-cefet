import { Injectable, Logger } from '@nestjs/common';
import {
  IRoutingCalculator,
  RouteData,
} from '../../application/ports/routing-calculator.port';

@Injectable()
export class RoutingAdapter implements IRoutingCalculator {
  private readonly logger = new Logger(RoutingAdapter.name);

  async calculateRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
  ): Promise<RouteData> {
    this.logger.log(
      `Calculating route from (${origin.latitude}, ${origin.longitude}) to (${destination.latitude}, ${destination.longitude})`,
    );

    // TODO: Implementar integração com msrouting via gRPC
    // Por enquanto retornamos valores simulados

    // Cálculo simplificado de distância euclidiana
    const distance =
      Math.sqrt(
        Math.pow(destination.latitude - origin.latitude, 2) +
          Math.pow(destination.longitude - origin.longitude, 2),
      ) * 111; // Aproximação: 1 grau = 111 km

    return {
      distance: Math.round(distance * 100) / 100,
      duration: Math.round(distance * 5), // 5 minutos por km (simplificado)
      estimatedFee: Math.max(5, Math.round(distance * 2 * 100) / 100), // R$ 2 por km, mínimo R$ 5
    };
  }
}
