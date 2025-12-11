import { EstrategiaRota, TipoVeiculo } from '../../domain/entities/rota.entity';

// Dados necessários para calcular uma rota
export class CalcularRotaDTO {
  origemLatitude: number;
  origemLongitude: number;
  destinoLatitude: number;
  destinoLongitude: number;
  pontosIntermediarios?: Array<{ latitude: number; longitude: number }>;
  estrategia?: EstrategiaRota;
  tipoVeiculo?: TipoVeiculo;
}

// Resultado do cálculo de rota
export class RotaDTO {
  id: string;
  origem: {
    latitude: number;
    longitude: number;
  };
  destino: {
    latitude: number;
    longitude: number;
  };
  pontosIntermediarios: Array<{ latitude: number; longitude: number }>;
  distanciaMetros: number;
  distanciaKm: number;
  duracaoSegundos: number;
  duracaoMinutos: number;
  passos: Array<{
    instrucao: string;
    distanciaMetros: number;
    duracaoSegundos: number;
    pontoInicio: { latitude: number; longitude: number };
    pontoFim: { latitude: number; longitude: number };
  }>;
  polyline: string;
  custoEstimado: number;
  estrategia: EstrategiaRota;
  tipoVeiculo?: TipoVeiculo;
  criadaEm: Date;
}

// Tempo estimado de chegada
export class ETADTO {
  etaMinutos: number;
  distanciaMetros: number;
  nivelTrafego?: string;
}
