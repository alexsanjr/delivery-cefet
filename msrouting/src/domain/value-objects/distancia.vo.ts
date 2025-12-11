// Distância em metros
export class Distancia {
  private readonly metros: number;

  private constructor(metros: number) {
    this.metros = metros;
  }

  static criar(metros: number): Distancia {
    if (metros < 0) {
      throw new Error('Distância não pode ser negativa');
    }

    if (!Number.isFinite(metros)) {
      throw new Error('Distância deve ser um número válido');
    }

    return new Distancia(metros);
  }

  obterMetros(): number {
    return this.metros;
  }

  obterQuilometros(): number {
    return this.metros / 1000;
  }

  somar(outra: Distancia): Distancia {
    return Distancia.criar(this.metros + outra.metros);
  }

  equals(outra: Distancia): boolean {
    return this.metros === outra.metros;
  }

  toString(): string {
    if (this.metros < 1000) {
      return `${this.metros.toFixed(0)}m`;
    }
    return `${this.obterQuilometros().toFixed(2)}km`;
  }
}
