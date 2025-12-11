import { Rota } from '../entities/rota.entity';
import { Ponto } from '../entities/ponto.entity';
import { EstrategiaRota } from '../entities/rota.entity';

/**
 * Port (Interface): Repositório de Rotas
 * Define contrato para persistência/cache de rotas calculadas
 */
export interface IRepositorioRota {
  /**
   * Busca rota em cache
   */
  buscarRotaEmCache(
    origem: Ponto,
    destino: Ponto,
    estrategia: EstrategiaRota,
  ): Promise<Rota | null>;

  /**
   * Salva rota em cache
   */
  salvarRotaEmCache(rota: Rota, ttlSegundos?: number): Promise<void>;

  /**
   * Gera chave única para cache baseada nos parâmetros da rota
   */
  gerarChaveCache(
    origem: Ponto,
    destino: Ponto,
    estrategia: EstrategiaRota,
  ): string;
}
