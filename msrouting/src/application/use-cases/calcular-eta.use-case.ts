import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IServicoAPIMapas } from '../../domain/repositories/api-mapas.interface';
import { TOKEN_SERVICO_API_MAPAS } from '../../domain/repositories/injection-tokens';
import { Ponto } from '../../domain/entities/ponto.entity';
import { EstrategiaRota } from '../../domain/entities/rota.entity';
import { ETADTO } from '../dtos/rota.dto';

/**
 * Calcula tempo estimado de chegada sem cache.
 * 
 * Usado para tracking em tempo real.
 */
@Injectable()
export class CalcularETACasoDeUso {
  private readonly logger = new Logger(CalcularETACasoDeUso.name);

  constructor(
    @Inject(TOKEN_SERVICO_API_MAPAS)
    private readonly servicoAPIMapas: IServicoAPIMapas,
  ) {}

  async executar(dados: {
    origemLatitude: number;
    origemLongitude: number;
    destinoLatitude: number;
    destinoLongitude: number;
  }): Promise<ETADTO> {
    this.logger.log(
      `Calculando ETA de (${dados.origemLatitude}, ${dados.origemLongitude}) ` +
        `para (${dados.destinoLatitude}, ${dados.destinoLongitude})`,
    );

    const origem = Ponto.criar({
      latitude: dados.origemLatitude,
      longitude: dados.origemLongitude,
    });

    const destino = Ponto.criar({
      latitude: dados.destinoLatitude,
      longitude: dados.destinoLongitude,
    });

    const rota = await this.servicoAPIMapas.calcularRota(
      origem,
      destino,
      [],
      EstrategiaRota.MAIS_RAPIDA,
    );

    return {
      etaMinutos: rota.DuracaoTotal.obterMinutos(),
      distanciaMetros: rota.DistanciaTotal.obterMetros(),
    };
  }
}
