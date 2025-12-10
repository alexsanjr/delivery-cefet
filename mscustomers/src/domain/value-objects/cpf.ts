export class CPF {
  private readonly valor: string;

  constructor(cpf: string) {
    this.validar(cpf);
    this.valor = this.normalizar(cpf);
  }

  private validar(cpf: string): void {
    if (!cpf) {
      throw new Error('CPF é obrigatório');
    }

    const apenasDigitos = cpf.replace(/\D/g, '');

    if (apenasDigitos.length !== 11) {
      throw new Error('CPF deve ter 11 dígitos');
    }

    if (/^(\d)\1{10}$/.test(apenasDigitos)) {
      throw new Error('CPF inválido');
    }

    if (!this.validarDigitosVerificadores(apenasDigitos)) {
      throw new Error('CPF inválido');
    }
  }

  private validarDigitosVerificadores(cpf: string): boolean {
    const calcularDigito = (cpf: string, fator: number): number => {
      let soma = 0;
      for (let i = 0; i < fator - 1; i++) {
        soma += parseInt(cpf.charAt(i)) * (fator - i);
      }
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };

    const digito1 = calcularDigito(cpf, 10);
    const digito2 = calcularDigito(cpf, 11);

    return (
      digito1 === parseInt(cpf.charAt(9)) &&
      digito2 === parseInt(cpf.charAt(10))
    );
  }

  private normalizar(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  obterValor(): string {
    return this.valor;
  }

  obterFormatado(): string {
    return `${this.valor.slice(0, 3)}.${this.valor.slice(3, 6)}.${this.valor.slice(6, 9)}-${this.valor.slice(9)}`;
  }

  ehIgual(outro: CPF): boolean {
    return this.valor === outro.valor;
  }

  toString(): string {
    return this.valor;
  }
}
