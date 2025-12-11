import { Ponto } from './ponto.entity';
import { Distancia } from '../value-objects/distancia.vo';
import { Duracao } from '../value-objects/duracao.vo';

export enum EstrategiaRota {
  MAIS_RAPIDA = 'MAIS_RAPIDA',
  MAIS_CURTA = 'MAIS_CURTA',
  MAIS_ECONOMICA = 'MAIS_ECONOMICA',
  ECO_FRIENDLY = 'ECO_FRIENDLY',
}

export enum TipoVeiculo {
  BICICLETA = 'BICICLETA',
  MOTO = 'MOTO',
  CARRO = 'CARRO',
  PATINETE = 'PATINETE',
  A_PE = 'A_PE',
}

// Representa um passo individual da rota
export class PassoRota {
  constructor(
    public readonly instrucao: string,
    public readonly distancia: Distancia,
    public readonly duracao: Duracao,
    public readonly pontoInicio: Ponto,
    public readonly pontoFim: Ponto,
  ) {}
}

// Aggregate Root: gerencia o ciclo de vida de uma rota completa
export class Rota {
  private readonly id: string;
  private readonly origem: Ponto;
  private readonly destino: Ponto;
  private readonly pontosIntermediarios: Ponto[];
  private readonly distanciaTotal: Distancia;
  private readonly duracaoTotal: Duracao;
  private readonly passos: PassoRota[];
  private readonly polyline: string;
  private readonly custoEstimado: number;
  private readonly estrategia: EstrategiaRota;
  private readonly tipoVeiculo?: TipoVeiculo;
  private readonly criadaEm: Date;

  private constructor(dados: {
    id: string;
    origem: Ponto;
    destino: Ponto;
    pontosIntermediarios: Ponto[];
    distanciaTotal: Distancia;
    duracaoTotal: Duracao;
    passos: PassoRota[];
    polyline: string;
    custoEstimado: number;
    estrategia: EstrategiaRota;
    tipoVeiculo?: TipoVeiculo;
    criadaEm: Date;
  }) {
    this.id = dados.id;
    this.origem = dados.origem;
    this.destino = dados.destino;
    this.pontosIntermediarios = dados.pontosIntermediarios;
    this.distanciaTotal = dados.distanciaTotal;
    this.duracaoTotal = dados.duracaoTotal;
    this.passos = dados.passos;
    this.polyline = dados.polyline;
    this.custoEstimado = dados.custoEstimado;
    this.estrategia = dados.estrategia;
    this.tipoVeiculo = dados.tipoVeiculo;
    this.criadaEm = dados.criadaEm;
  }

  static criar(dados: {
    origem: Ponto;
    destino: Ponto;
    pontosIntermediarios?: Ponto[];
    distanciaTotal: Distancia;
    duracaoTotal: Duracao;
    passos: PassoRota[];
    polyline: string;
    custoEstimado: number;
    estrategia: EstrategiaRota;
    tipoVeiculo?: TipoVeiculo;
  }): Rota {
    const id = `rota_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return new Rota({
      id,
      origem: dados.origem,
      destino: dados.destino,
      pontosIntermediarios: dados.pontosIntermediarios || [],
      distanciaTotal: dados.distanciaTotal,
      duracaoTotal: dados.duracaoTotal,
      passos: dados.passos,
      polyline: dados.polyline,
      custoEstimado: dados.custoEstimado,
      estrategia: dados.estrategia,
      tipoVeiculo: dados.tipoVeiculo,
      criadaEm: new Date(),
    });
  }

  // Getters
  get Id(): string {
    return this.id;
  }

  get Origem(): Ponto {
    return this.origem;
  }

  get Destino(): Ponto {
    return this.destino;
  }

  get PontosIntermediarios(): Ponto[] {
    return [...this.pontosIntermediarios];
  }

  get DistanciaTotal(): Distancia {
    return this.distanciaTotal;
  }

  get DuracaoTotal(): Duracao {
    return this.duracaoTotal;
  }

  get Passos(): PassoRota[] {
    return [...this.passos];
  }

  get Polyline(): string {
    return this.polyline;
  }

  get CustoEstimado(): number {
    return this.custoEstimado;
  }

  get Estrategia(): EstrategiaRota {
    return this.estrategia;
  }

  get TipoVeiculo(): TipoVeiculo | undefined {
    return this.tipoVeiculo;
  }

  get CriadaEm(): Date {
    return this.criadaEm;
  }
}
