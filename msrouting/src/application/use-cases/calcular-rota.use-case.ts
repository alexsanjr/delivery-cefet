import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IRepositorioRota } from '../../domain/repositories/rota.repository.interface';
import type { IServicoAPIMapas } from '../../domain/repositories/api-mapas.interface';
import {
  TOKEN_REPOSITORIO_ROTA,
  TOKEN_SERVICO_API_MAPAS,
} from '../../domain/repositories/injection-tokens';
import { Ponto } from '../../domain/entities/ponto.entity';
import { EstrategiaRota } from '../../domain/entities/rota.entity';
import { CalcularRotaDTO, RotaDTO } from '../dtos/rota.dto';
import { RotaMapper } from '../mappers/rota.mapper';
import { RotaEventPublisher } from '../../domain/events/route-event.publisher';

/**
 * Calcula rota entre origem e destino.
 * 
 * Verifica cache antes de chamar API externa.
 * Publica evento após calcular.
 */
@Injectable()
export class CalcularRotaCasoDeUso {
  private readonly logger = new Logger(CalcularRotaCasoDeUso.name);

  constructor(
    @Inject(TOKEN_REPOSITORIO_ROTA)
    private readonly repositorioRota: IRepositorioRota,
    @Inject(TOKEN_SERVICO_API_MAPAS)
    private readonly servicoAPIMapas: IServicoAPIMapas,
    private readonly rotaEventPublisher: RotaEventPublisher,
  ) {}

  async executar(dados: CalcularRotaDTO): Promise<RotaDTO> {
    this.logger.log(
      `Calculando rota de (${dados.origemLatitude}, ${dados.origemLongitude}) ` +
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

    const pontosIntermediarios = (dados.pontosIntermediarios || []).map(
      (p) => Ponto.criar({ latitude: p.latitude, longitude: p.longitude }),
    );

    const estrategia = dados.estrategia || EstrategiaRota.MAIS_RAPIDA;

    const rotaEmCache = await this.repositorioRota.buscarRotaEmCache(
      origem,
      destino,
      estrategia,
    );

    if (rotaEmCache) {
      this.logger.log('Rota encontrada em cache');
      return RotaMapper.paraDTO(rotaEmCache);
    }

    this.logger.log('Calculando nova rota...');
    const rotaCalculada = await this.servicoAPIMapas.calcularRota(
      origem,
      destino,
      pontosIntermediarios,
      estrategia,
    );

    await this.repositorioRota.salvarRotaEmCache(rotaCalculada, 3600);
    await this.rotaEventPublisher.publicarRotaCalculada(rotaCalculada);

    this.logger.log('Rota calculada e armazenada em cache');
    return RotaMapper.paraDTO(rotaCalculada);
  }
}
