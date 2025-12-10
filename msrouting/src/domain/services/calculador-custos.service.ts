import { Rota, EstrategiaRota } from '../entities/rota.entity';
import { Ponto } from '../entities/ponto.entity';
import { Distancia } from '../value-objects/distancia.vo';
import { Duracao } from '../value-objects/duracao.vo';

// Calcula custos de entrega baseado em distância e tipo de veículo
export class CalculadorCustosRota {
  private static readonly CUSTO_BASE_POR_KM = 2.5; // R$ por km
  private static readonly CUSTO_POR_MINUTO = 0.5; // R$ por minuto

  /**
   * Calcula custo estimado baseado na distância e duração
   */
  static calcularCustoEstimado(
    distancia: Distancia,
    duracao: Duracao,
    estrategia: EstrategiaRota,
  ): number {
    const custoDistancia =
      distancia.obterQuilometros() * this.CUSTO_BASE_POR_KM;
    const custoTempo = duracao.obterMinutos() * this.CUSTO_POR_MINUTO;

    let custoTotal = custoDistancia + custoTempo;

    // Ajuste baseado na estratégia
    switch (estrategia) {
      case EstrategiaRota.MAIS_ECONOMICA:
        custoTotal *= 0.85; // 15% de desconto
        break;
      case EstrategiaRota.MAIS_RAPIDA:
        custoTotal *= 1.2; // 20% premium
        break;
      case EstrategiaRota.ECO_FRIENDLY:
        custoTotal *= 0.95; // 5% de desconto
        break;
    }

    return Math.round(custoTotal * 100) / 100; // Arredondar para 2 casas decimais
  }

  /**
   * Calcula custo considerando tipo de veículo
   */
  static calcularCustoComVeiculo(
    distancia: Distancia,
    duracao: Duracao,
    tipoVeiculo: string,
  ): number {
    const custoBase =
      distancia.obterQuilometros() * this.CUSTO_BASE_POR_KM +
      duracao.obterMinutos() * this.CUSTO_POR_MINUTO;

    const multiplicadores: Record<string, number> = {
      BICICLETA: 0.6,
      MOTO: 0.8,
      CARRO: 1.0,
      PATINETE: 0.7,
      A_PE: 0.3,
    };

    const multiplicador = multiplicadores[tipoVeiculo] || 1.0;
    return Math.round(custoBase * multiplicador * 100) / 100;
  }
}
