import { Injectable, Logger, Inject } from '@nestjs/common';
import { OtimizadorRotas } from '../../domain/services/otimizador-rotas.service';
import { RotaEventPublisher } from '../../domain/events/route-event.publisher';

export interface OtimizarEntregasDTO {
  deposito: { latitude: number; longitude: number };
  entregas: Array<{
    delivery_id: string;
    location: { latitude: number; longitude: number };
    service_time_seconds: number;
  }>;
  veiculos: Array<{
    vehicle_id: string;
    type: string;
    capacity_kg: number;
    max_speed_kph: number;
  }>;
}

export interface RotaOtimizadaDTO {
  vehicle_routes: Array<{
    vehicle_id: string;
    deliveries: Array<string>;
    total_distance_meters: number;
    total_duration_seconds: number;
  }>;
  total_cost: number;
  total_distance_meters: number;
  total_duration_seconds: number;
}

/**
 * Otimiza sequência de múltiplas entregas.
 * 
 * Resolve problema de roteamento de veículos (VRP).
 */
@Injectable()
export class OtimizarEntregasCasoDeUso {
  private readonly logger = new Logger(OtimizarEntregasCasoDeUso.name);

  constructor(
    private readonly otimizadorRotas: OtimizadorRotas,
    private readonly rotaEventPublisher: RotaEventPublisher,
  ) {}

  async executar(dto: OtimizarEntregasDTO): Promise<RotaOtimizadaDTO> {
    this.logger.log(
      `Otimizando ${dto.entregas.length} entregas para ${dto.veiculos.length} veículos`,
    );

    const rotasVeiculos = this.otimizadorRotas.otimizarEntregas(
      dto.deposito,
      dto.entregas,
      dto.veiculos,
    );

    const totalDistance = rotasVeiculos.reduce(
      (sum, rota) => sum + rota.total_distance_meters,
      0,
    );
    const totalDuration = rotasVeiculos.reduce(
      (sum, rota) => sum + rota.total_duration_seconds,
      0,
    );
    const totalCost = this.calcularCusto(totalDistance, totalDuration);

    const resultado = {
      vehicle_routes: rotasVeiculos,
      total_cost: totalCost,
      total_distance_meters: totalDistance,
      total_duration_seconds: totalDuration,
    };

    await this.rotaEventPublisher.publicarRotasOtimizadas(resultado);

    return resultado;
  }

  private calcularCusto(distanciaMetros: number, duracaoSegundos: number): number {
    const CUSTO_POR_KM = 2.5;
    const CUSTO_POR_HORA = 50;

    const distanciaKm = distanciaMetros / 1000;
    const duracaoHoras = duracaoSegundos / 3600;

    return distanciaKm * CUSTO_POR_KM + duracaoHoras * CUSTO_POR_HORA;
  }
}
