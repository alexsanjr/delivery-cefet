import { Rota } from '../entities/rota.entity';
import { Ponto } from '../entities/ponto.entity';
import { EstrategiaRota } from '../entities/rota.entity';

/**
 * Port (Interface): Serviço de API Externa de Mapas
 * Define contrato para integração com APIs de mapas (Google Maps, etc)
 */
export interface IServicoAPIMapas {
  /**
   * Calcula rota usando API externa
   */
  calcularRota(
    origem: Ponto,
    destino: Ponto,
    pontosIntermediarios: Ponto[],
    estrategia: EstrategiaRota,
  ): Promise<Rota>;

  /**
   * Verifica se API está disponível
   */
  verificarDisponibilidade(): Promise<boolean>;
}
