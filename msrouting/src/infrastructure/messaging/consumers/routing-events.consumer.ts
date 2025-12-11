import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { CalcularRotaCasoDeUso } from '../../../application/use-cases/calcular-rota.use-case';
import { CalcularETACasoDeUso } from '../../../application/use-cases/calcular-eta.use-case';
import { OtimizarEntregasCasoDeUso } from '../../../application/use-cases/otimizar-entregas.use-case';

// Consome requisições de roteamento de outros microserviços
@Injectable()
export class RoutingEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(RoutingEventsConsumer.name);

  constructor(
    private readonly rabbitMQ: RabbitMQService,
    private readonly calcularRotaCasoDeUso: CalcularRotaCasoDeUso,
    private readonly calcularETACasoDeUso: CalcularETACasoDeUso,
    private readonly otimizarEntregasCasoDeUso: OtimizarEntregasCasoDeUso,
  ) {}

  async onModuleInit() {
    // Escutar requisições de cálculo de rota
    await this.consumirCalculoRota();
    
    // Escutar requisições de cálculo de ETA
    await this.consumirCalculoETA();
    
    // Escutar requisições de otimização de entregas
    await this.consumirOtimizacaoEntregas();
  }

  private async consumirCalculoRota() {
    await this.rabbitMQ.consume(
      'routing.route.request',
      'RouteRequest',
      async (data) => {
        this.logger.log(
          `🚗 Calculando rota: ${data.origin?.latitude},${data.origin?.longitude} → ${data.destination?.latitude},${data.destination?.longitude}`,
        );

        try {
          const rota = await this.calcularRotaCasoDeUso.executar({
            origemLatitude: data.origin.latitude,
            origemLongitude: data.origin.longitude,
            destinoLatitude: data.destination.latitude,
            destinoLongitude: data.destination.longitude,
            pontosIntermediarios: data.waypoints || [],
            estrategia: data.strategy || 1,
          });

          await this.rabbitMQ.publish('routing.route.response', 'RouteResponse', {
            path: [
              { latitude: rota.origem.latitude, longitude: rota.origem.longitude },
              { latitude: rota.destino.latitude, longitude: rota.destino.longitude },
            ],
            distance_meters: rota.distanciaMetros,
            duration_seconds: rota.duracaoSegundos,
            encoded_polyline: rota.polyline,
            steps: rota.passos,
            estimated_cost: rota.custoEstimado,
          });
        } catch (error) {
          this.logger.error('❌ Erro ao calcular rota:', error);
        }
      },
    );
  }

  /**
   * Consome requisições de cálculo de ETA via fila
   */
  private async consumirCalculoETA() {
    await this.rabbitMQ.consume(
      'routing.eta.request',
      'ETARequest',
      async (data) => {
        this.logger.log(`⏱️ Calculando ETA`);

        try {
          const eta = await this.calcularETACasoDeUso.executar({
            origemLatitude: data.origin.latitude,
            origemLongitude: data.origin.longitude,
            destinoLatitude: data.destination.latitude,
            destinoLongitude: data.destination.longitude,
          });

          await this.rabbitMQ.publish('routing.eta.response', 'ETAResponse', {
            eta_minutes: eta.etaMinutos,
            distance_meters: eta.distanciaMetros,
            current_traffic: data.traffic_level || 1,
          });
        } catch (error) {
          this.logger.error('❌ Erro ao calcular ETA:', error);
        }
      },
    );
  }

  private async consumirOtimizacaoEntregas() {
    await this.rabbitMQ.consume(
      'routing.optimization.request',
      'DeliveryOptimizationRequest',
      async (data) => {
        this.logger.log(
          `📦 Otimizando ${data.deliveries?.length} entregas para ${data.vehicles?.length} veículos`,
        );

        try {
          const resultado = await this.otimizarEntregasCasoDeUso.executar({
            deposito: data.depot,
            entregas: data.deliveries,
            veiculos: data.vehicles,
          });

          await this.rabbitMQ.publish(
            'routing.optimization.response',
            'OptimizedRouteResponse',
            resultado,
          );
        } catch (error) {
          this.logger.error('❌ Erro ao otimizar entregas:', error);
        }
      },
    );
  }
}
