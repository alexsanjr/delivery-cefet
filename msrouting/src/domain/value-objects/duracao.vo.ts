// Duração em segundos
export class Duracao {
  private readonly segundos: number;

  private constructor(segundos: number) {
    this.segundos = segundos;
  }

  static criar(segundos: number): Duracao {
    if (segundos < 0) {
      throw new Error('Duração não pode ser negativa');
    }

    if (!Number.isFinite(segundos)) {
      throw new Error('Duração deve ser um número válido');
    }

    return new Duracao(segundos);
  }

  obterSegundos(): number {
    return this.segundos;
  }

  obterMinutos(): number {
    return this.segundos / 60;
  }

  obterHoras(): number {
    return this.segundos / 3600;
  }

  somar(outra: Duracao): Duracao {
    return Duracao.criar(this.segundos + outra.segundos);
  }

  equals(outra: Duracao): boolean {
    return this.segundos === outra.segundos;
  }

  toString(): string {
    const horas = Math.floor(this.obterHoras());
    const minutos = Math.floor(this.obterMinutos() % 60);
    const segundos = Math.floor(this.segundos % 60);

    if (horas > 0) {
      return `${horas}h ${minutos}min`;
    }
    if (minutos > 0) {
      return `${minutos}min ${segundos}s`;
    }
    return `${segundos}s`;
  }
}
