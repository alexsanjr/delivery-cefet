import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../../infrastructure/messaging/rabbitmq.service';
import { Rota } from '../entities/rota.entity';

// Publica eventos de roteamento via RabbitMQ
@Injectable()
export class RotaEventPublisher {
  constructor(private readonly rabbitMQ: RabbitMQService) {}

  /**
   * Publica evento quando rota é calculada
   */
  async publicarRotaCalculada(rota: Rota): Promise<void> {
    const evento = {
      path: [
        { latitude: rota.Origem.obterLatitude(), longitude: rota.Origem.obterLongitude() },
        { latitude: rota.Destino.obterLatitude(), longitude: rota.Destino.obterLongitude() },
      ],
      distance_meters: rota.DistanciaTotal.obterMetros(),
      duration_seconds: rota.DuracaoTotal.obterSegundos(),
      encoded_polyline: rota.Polyline,
      steps: rota.Passos.map((passo) => ({
        instruction: passo.instrucao,
        distance_meters: passo.distancia.obterMetros(),
        duration_seconds: passo.duracao.obterSegundos(),
        start_location: passo.pontoInicio,
        end_location: passo.pontoFim,
      })),
      estimated_cost: rota.CustoEstimado,
    };

    await this.rabbitMQ.publish(
      'routing.route.calculated',
      'RouteResponse',
      evento,
    );
  }

  /**
   * Publica evento quando rotas são otimizadas (VRP)
   */
  async publicarRotasOtimizadas(
    resultado: {
      vehicle_routes: Array<{
        vehicle_id: string;
        deliveries: Array<string>;
        total_distance_meters: number;
        total_duration_seconds: number;
      }>;
      total_cost: number;
      total_distance_meters: number;
      total_duration_seconds: number;
    },
  ): Promise<void> {
    await this.rabbitMQ.publish(
      'routing.routes.optimized',
      'OptimizedRouteResponse',
      resultado,
    );
  }

  /**
   * Publica evento de ETA calculado
   */
  async publicarETACalculado(eta: {
    etaMinutos: number;
    distanciaMetros: number;
  }): Promise<void> {
    const evento = {
      eta_minutes: eta.etaMinutos,
      distance_meters: eta.distanciaMetros,
      current_traffic: 1, // LIGHT
    };

    await this.rabbitMQ.publish(
      'routing.eta.calculated',
      'ETAResponse',
      evento,
    );
  }
}
