export class Telefone {
  private readonly valor: string;

  constructor(telefone: string) {
    this.validar(telefone);
    this.valor = this.normalizar(telefone);
  }

  private validar(telefone: string): void {
    if (!telefone) {
      throw new Error('Telefone é obrigatório');
    }

    const apenasDigitos = telefone.replace(/\D/g, '');
    if (apenasDigitos.length < 10 || apenasDigitos.length > 11) {
      throw new Error('Telefone deve ter 10 ou 11 dígitos');
    }
  }

  private normalizar(telefone: string): string {
    return telefone.replace(/\D/g, '');
  }

  obterValor(): string {
    return this.valor;
  }

  obterFormatado(): string {
    if (this.valor.length === 11) {
      return `(${this.valor.slice(0, 2)}) ${this.valor.slice(2, 7)}-${this.valor.slice(7)}`;
    }
    return `(${this.valor.slice(0, 2)}) ${this.valor.slice(2, 6)}-${this.valor.slice(6)}`;
  }

  ehIgual(outro: Telefone): boolean {
    return this.valor === outro.valor;
  }

  toString(): string {
    return this.valor;
  }
}
