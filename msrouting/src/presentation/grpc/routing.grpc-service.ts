import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { CalcularRotaCasoDeUso } from '../../application/use-cases/calcular-rota.use-case';
import { CalcularETACasoDeUso } from '../../application/use-cases/calcular-eta.use-case';
import { OtimizarEntregasCasoDeUso } from '../../application/use-cases/otimizar-entregas.use-case';
import { EstrategiaRota } from '../../domain/entities/rota.entity';

// Expõe funcionalidades de roteamento via gRPC
@Controller()
export class RoutingGrpcController {
  private readonly logger = new Logger(RoutingGrpcController.name);

  constructor(
    private readonly calcularRotaCasoDeUso: CalcularRotaCasoDeUso,
    private readonly calcularETACasoDeUso: CalcularETACasoDeUso,
    private readonly otimizarEntregasCasoDeUso: OtimizarEntregasCasoDeUso,
  ) {
    this.logger.log('🔄 RoutingGrpcController inicializado');
  }

  @GrpcMethod('RoutingService', 'HealthCheck')
  async healthCheck(): Promise<{ status: string }> {
    this.logger.log('📡 HealthCheck chamado');
    return { status: 'SERVING' };
  }

  @GrpcMethod('RoutingService', 'CalculateRoute')
  async calculateRoute(data: {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    strategy?: number;
    waypoints?: Array<{ latitude: number; longitude: number }>;
  }): Promise<any> {
    try {
      this.logger.log('📡 CalculateRoute chamado', {
        origin: data.origin,
        destination: data.destination,
        strategy: data.strategy,
      });

      // Validações
      if (!data.origin || !data.destination) {
        throw new RpcException({
          code: 3, // INVALID_ARGUMENT
          message: 'Origem e destino são obrigatórios',
        });
      }

      if (!this.validarCoordenada(data.origin) || !this.validarCoordenada(data.destination)) {
        throw new RpcException({
          code: 3,
          message: 'Coordenadas inválidas',
        });
      }

      // Mapear estratégia do enum gRPC para domain
      const estrategia = this.mapearEstrategia(data.strategy);

      // Executar use case
      const rota = await this.calcularRotaCasoDeUso.executar({
        origemLatitude: data.origin.latitude,
        origemLongitude: data.origin.longitude,
        destinoLatitude: data.destination.latitude,
        destinoLongitude: data.destination.longitude,
        pontosIntermediarios: data.waypoints,
        estrategia,
      });

      // Converter para formato gRPC
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
    } catch (error) {
      this.logger.error('❌ Erro ao calcular rota:', error);
      throw new RpcException({
        code: error.code || 13, // INTERNAL
        message: error.message || 'Erro ao calcular rota',
      });
    }
  }

  @GrpcMethod('RoutingService', 'CalculateETA')
  async calculateETA(data: {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
  }): Promise<any> {
    try {
      this.logger.log('📡 CalculateETA chamado');

      const eta = await this.calcularETACasoDeUso.executar({
        origemLatitude: data.origin.latitude,
        origemLongitude: data.origin.longitude,
        destinoLatitude: data.destination.latitude,
        destinoLongitude: data.destination.longitude,
      });

      return {
        eta_minutes: eta.etaMinutos,
        distance_meters: eta.distanciaMetros,
        current_traffic: 1, // LIGHT
      };
    } catch (error) {
      this.logger.error('❌ Erro ao calcular ETA:', error);
      throw new RpcException({
        code: 13,
        message: error.message || 'Erro ao calcular ETA',
      });
    }
  }

  @GrpcMethod('RoutingService', 'OptimizeDeliveryRoute')
  async optimizeDeliveryRoute(data: {
    depot: { latitude: number; longitude: number };
    deliveries: Array<{
      delivery_id: string;
      location: { latitude: number; longitude: number };
      service_time_seconds: number;
    }>;
    vehicles: Array<{
      vehicle_id: string;
      type: string;
      capacity_kg: number;
      max_speed_kph: number;
    }>;
  }): Promise<any> {
    try {
      this.logger.log('📡 OptimizeDeliveryRoute chamado', {
        deliveries: data.deliveries?.length,
        vehicles: data.vehicles?.length,
      });

      const resultado = await this.otimizarEntregasCasoDeUso.executar({
        deposito: data.depot,
        entregas: data.deliveries,
        veiculos: data.vehicles,
      });

      return resultado;
    } catch (error) {
      this.logger.error('❌ Erro ao otimizar rotas:', error);
      throw new RpcException({
        code: 13,
        message: error.message || 'Erro ao otimizar rotas',
      });
    }
  }

  private validarCoordenada(coord: { latitude: number; longitude: number }): boolean {
    return (
      coord.latitude >= -90 &&
      coord.latitude <= 90 &&
      coord.longitude >= -180 &&
      coord.longitude <= 180
    );
  }

  private mapearEstrategia(strategy?: number): EstrategiaRota {
    switch (strategy) {
      case 1:
        return EstrategiaRota.MAIS_RAPIDA;
      case 2:
        return EstrategiaRota.MAIS_CURTA;
      case 3:
        return EstrategiaRota.MAIS_ECONOMICA;
      case 4:
        return EstrategiaRota.ECO_FRIENDLY;
      default:
        return EstrategiaRota.MAIS_RAPIDA;
    }
  }
}
