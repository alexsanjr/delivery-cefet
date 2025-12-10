export class Email {
  private readonly valor: string;

  constructor(email: string) {
    this.validar(email);
    this.valor = email.toLowerCase().trim();
  }

  private validar(email: string): void {
    if (!email) {
      throw new Error('Email é obrigatório');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido');
    }
  }

  obterValor(): string {
    return this.valor;
  }

  ehIgual(outro: Email): boolean {
    return this.valor === outro.valor;
  }

  toString(): string {
    return this.valor;
  }
}
