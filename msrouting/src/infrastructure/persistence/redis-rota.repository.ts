import { Injectable, Logger } from '@nestjs/common';
import type { IRepositorioRota } from '../../domain/repositories/rota.repository.interface';
import { Rota, EstrategiaRota } from '../../domain/entities/rota.entity';
import { Ponto } from '../../domain/entities/ponto.entity';
import { Distancia } from '../../domain/value-objects/distancia.vo';
import { Duracao } from '../../domain/value-objects/duracao.vo';
import { PassoRota } from '../../domain/entities/rota.entity';
import { RedisService } from '../cache/redis.service';

// Implementação do repositório de rotas usando Redis
@Injectable()
export class RepositorioRedisRota implements IRepositorioRota {
  private readonly logger = new Logger(RepositorioRedisRota.name);
  private readonly TTL_PADRAO = 3600; // 1 hora

  constructor(private readonly redis: RedisService) {}

  async buscarRotaEmCache(
    origem: Ponto,
    destino: Ponto,
    estrategia: EstrategiaRota,
  ): Promise<Rota | null> {
    const chave = this.gerarChaveCache(origem, destino, estrategia);

    try {
      const dadosCache = await this.redis.get<any>(`route:${chave}`);

      if (!dadosCache) {
        return null;
      }

      // Reconstituir a entidade Rota a partir dos dados em cache
      return this.reconstruirRotaDeCache(dadosCache);
    } catch (erro) {
      this.logger.error(`Erro ao buscar rota em cache: ${erro.message}`);
      return null;
    }
  }

  async salvarRotaEmCache(
    rota: Rota,
    ttlSegundos?: number,
  ): Promise<void> {
    const chave = this.gerarChaveCache(
      rota.Origem,
      rota.Destino,
      rota.Estrategia,
    );

    try {
      const dadosParaCache = this.serializarRota(rota);
      await this.redis.set(
        `route:${chave}`,
        dadosParaCache,
        ttlSegundos || this.TTL_PADRAO,
      );

      this.logger.log(`Rota salva em cache com chave: ${chave}`);
    } catch (erro) {
      this.logger.error(`Erro ao salvar rota em cache: ${erro.message}`);
    }
  }

  gerarChaveCache(
    origem: Ponto,
    destino: Ponto,
    estrategia: EstrategiaRota,
  ): string {
    return `${origem.obterLatitude()},${origem.obterLongitude()}_` +
           `${destino.obterLatitude()},${destino.obterLongitude()}_` +
           `${estrategia}`;
  }

  private serializarRota(rota: Rota): any {
    return {
      id: rota.Id,
      origem: {
        latitude: rota.Origem.obterLatitude(),
        longitude: rota.Origem.obterLongitude(),
      },
      destino: {
        latitude: rota.Destino.obterLatitude(),
        longitude: rota.Destino.obterLongitude(),
      },
      pontosIntermediarios: rota.PontosIntermediarios.map(p => ({
        latitude: p.obterLatitude(),
        longitude: p.obterLongitude(),
      })),
      distanciaMetros: rota.DistanciaTotal.obterMetros(),
      duracaoSegundos: rota.DuracaoTotal.obterSegundos(),
      passos: rota.Passos.map(passo => ({
        instrucao: passo.instrucao,
        distanciaMetros: passo.distancia.obterMetros(),
        duracaoSegundos: passo.duracao.obterSegundos(),
        pontoInicio: {
          latitude: passo.pontoInicio.obterLatitude(),
          longitude: passo.pontoInicio.obterLongitude(),
        },
        pontoFim: {
          latitude: passo.pontoFim.obterLatitude(),
          longitude: passo.pontoFim.obterLongitude(),
        },
      })),
      polyline: rota.Polyline,
      custoEstimado: rota.CustoEstimado,
      estrategia: rota.Estrategia,
      tipoVeiculo: rota.TipoVeiculo,
      criadaEm: rota.CriadaEm.toISOString(),
    };
  }

  private reconstruirRotaDeCache(dados: any): Rota {
    const origem = Ponto.criar({
      latitude: dados.origem.latitude,
      longitude: dados.origem.longitude,
    });

    const destino = Ponto.criar({
      latitude: dados.destino.latitude,
      longitude: dados.destino.longitude,
    });

    const pontosIntermediarios = (dados.pontosIntermediarios || []).map(
      (p: any) => Ponto.criar({ latitude: p.latitude, longitude: p.longitude }),
    );

    const passos = dados.passos.map((p: any) => {
      return new PassoRota(
        p.instrucao,
        Distancia.criar(p.distanciaMetros),
        Duracao.criar(p.duracaoSegundos),
        Ponto.criar({
          latitude: p.pontoInicio.latitude,
          longitude: p.pontoInicio.longitude,
        }),
        Ponto.criar({
          latitude: p.pontoFim.latitude,
          longitude: p.pontoFim.longitude,
        }),
      );
    });

    return Rota.criar({
      origem,
      destino,
      pontosIntermediarios,
      distanciaTotal: Distancia.criar(dados.distanciaMetros),
      duracaoTotal: Duracao.criar(dados.duracaoSegundos),
      passos,
      polyline: dados.polyline,
      custoEstimado: dados.custoEstimado,
      estrategia: dados.estrategia,
      tipoVeiculo: dados.tipoVeiculo,
    });
  }
}
