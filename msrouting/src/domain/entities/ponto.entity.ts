import { Coordenada } from '../value-objects/coordenada.vo';

// Ponto geográfico em uma rota
export class Ponto {
  private readonly id: string;
  private readonly coordenada: Coordenada;
  private readonly endereco?: string;

  private constructor(id: string, coordenada: Coordenada, endereco?: string) {
    this.id = id;
    this.coordenada = coordenada;
    this.endereco = endereco;
  }

  static criar(dados: {
    latitude: number;
    longitude: number;
    endereco?: string;
  }): Ponto {
    const coordenada = Coordenada.criar(dados.latitude, dados.longitude);
    const id = `${dados.latitude},${dados.longitude}`;
    return new Ponto(id, coordenada, dados.endereco);
  }

  static criarComId(dados: {
    id: string;
    latitude: number;
    longitude: number;
    endereco?: string;
  }): Ponto {
    const coordenada = Coordenada.criar(dados.latitude, dados.longitude);
    return new Ponto(dados.id, coordenada, dados.endereco);
  }

  obterLatitude(): number {
    return this.coordenada.obterLatitude();
  }

  obterLongitude(): number {
    return this.coordenada.obterLongitude();
  }

  obterCoordenada(): Coordenada {
    return this.coordenada;
  }

  obterEndereco(): string | undefined {
    return this.endereco;
  }

  calcularDistanciaAte(outro: Ponto): number {
    return this.coordenada.calcularDistanciaAte(outro.coordenada);
  }
}
