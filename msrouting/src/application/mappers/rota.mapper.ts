import { Rota } from '../../domain/entities/rota.entity';
import { RotaDTO } from '../dtos/rota.dto';

/**
 * Mapper: Converte entre entidade Rota e DTO
 */
export class RotaMapper {
  static paraDTO(rota: Rota): RotaDTO {
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
      pontosIntermediarios: rota.PontosIntermediarios.map((ponto) => ({
        latitude: ponto.obterLatitude(),
        longitude: ponto.obterLongitude(),
      })),
      distanciaMetros: rota.DistanciaTotal.obterMetros(),
      distanciaKm: rota.DistanciaTotal.obterQuilometros(),
      duracaoSegundos: rota.DuracaoTotal.obterSegundos(),
      duracaoMinutos: rota.DuracaoTotal.obterMinutos(),
      passos: rota.Passos.map((passo) => ({
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
      criadaEm: rota.CriadaEm,
    };
  }
}
