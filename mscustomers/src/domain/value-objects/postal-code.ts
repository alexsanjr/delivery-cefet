export class Cep {
  private readonly valor: string;

  constructor(cep: string) {
    this.validar(cep);
    this.valor = this.normalizar(cep);
  }

  private validar(cep: string): void {
    if (!cep) {
      throw new Error('CEP é obrigatório');
    }

    const apenasDigitos = cep.replace(/\D/g, '');
    if (apenasDigitos.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }
  }

  private normalizar(cep: string): string {
    return cep.replace(/\D/g, '');
  }

  obterValor(): string {
    return this.valor;
  }

  obterFormatado(): string {
    return `${this.valor.slice(0, 5)}-${this.valor.slice(5)}`;
  }

  ehIgual(outro: Cep): boolean {
    return this.valor === outro.valor;
  }

  toString(): string {
    return this.valor;
  }
}
