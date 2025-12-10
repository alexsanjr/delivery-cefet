import { Injectable, Logger } from '@nestjs/common';

// Otimiza ordem de entregas usando algoritmo Nearest Neighbor
@Injectable()
export class OtimizadorRotas {
  private readonly logger = new Logger(OtimizadorRotas.name);

  /**
   * Otimiza rotas para múltiplas entregas usando algoritmo nearest neighbor
   */
  otimizarEntregas(
    deposito: { latitude: number; longitude: number },
    entregas: Array<{
      delivery_id: string;
      location: { latitude: number; longitude: number };
      service_time_seconds: number;
    }>,
    veiculos: Array<{
      vehicle_id: string;
      type: string;
      capacity_kg: number;
      max_speed_kph: number;
    }>,
  ): Array<{
    vehicle_id: string;
    deliveries: Array<string>;
    total_distance_meters: number;
    total_duration_seconds: number;
  }> {
    this.logger.log(
      `Otimizando ${entregas.length} entregas para ${veiculos.length} veículos`,
    );

    const resultado: Array<{
      vehicle_id: string;
      deliveries: Array<string>;
      total_distance_meters: number;
      total_duration_seconds: number;
    }> = [];
    const entregasRestantes = [...entregas];
    const entregasPorVeiculo = Math.ceil(entregas.length / veiculos.length);

    for (const veiculo of veiculos) {
      if (entregasRestantes.length === 0) break;

      const entregasVeiculo: string[] = [];
      let pontoAtual = deposito;
      let distanciaTotal = 0;
      let duracaoTotal = 0;

      // Algoritmo Nearest Neighbor: escolher entrega mais próxima
      for (let i = 0; i < entregasPorVeiculo && entregasRestantes.length > 0; i++) {
        let indexMaisProximo = 0;
        let menorDistancia = Number.MAX_VALUE;

        // Encontrar entrega mais próxima
        for (let j = 0; j < entregasRestantes.length; j++) {
          const distancia = this.calcularDistanciaHaversine(
            pontoAtual,
            entregasRestantes[j].location,
          );
          if (distancia < menorDistancia) {
            menorDistancia = distancia;
            indexMaisProximo = j;
          }
        }

        const entregaSelecionada = entregasRestantes.splice(indexMaisProximo, 1)[0];
        entregasVeiculo.push(entregaSelecionada.delivery_id);
        distanciaTotal += menorDistancia;
        duracaoTotal += this.calcularDuracao(
          menorDistancia,
          veiculo.max_speed_kph,
        );
        duracaoTotal += entregaSelecionada.service_time_seconds;

        pontoAtual = entregaSelecionada.location;
      }

      // Retorno ao depósito
      const distanciaRetorno = this.calcularDistanciaHaversine(
        pontoAtual,
        deposito,
      );
      distanciaTotal += distanciaRetorno;
      duracaoTotal += this.calcularDuracao(
        distanciaRetorno,
        veiculo.max_speed_kph,
      );

      resultado.push({
        vehicle_id: veiculo.vehicle_id,
        deliveries: entregasVeiculo,
        total_distance_meters: Math.round(distanciaTotal),
        total_duration_seconds: Math.round(duracaoTotal),
      });
    }

    return resultado;
  }

  private calcularDistanciaHaversine(
    ponto1: { latitude: number; longitude: number },
    ponto2: { latitude: number; longitude: number },
  ): number {
    const R = 6371000; // Raio da Terra em metros
    const phi1 = (ponto1.latitude * Math.PI) / 180;
    const phi2 = (ponto2.latitude * Math.PI) / 180;
    const deltaPhi = ((ponto2.latitude - ponto1.latitude) * Math.PI) / 180;
    const deltaLambda = ((ponto2.longitude - ponto1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calcularDuracao(distanciaMetros: number, velocidadeKmh: number): number {
    const velocidadeMs = (velocidadeKmh * 1000) / 3600;
    return distanciaMetros / velocidadeMs;
  }
}
