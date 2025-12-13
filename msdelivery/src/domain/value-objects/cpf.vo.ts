import { DomainException } from '../exceptions/domain.exception';

export class Cpf {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): Cpf {
    if (!value) {
      throw new DomainException('CPF é obrigatório');
    }

    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length !== 11) {
      throw new DomainException('CPF deve ter 11 dígitos');
    }

    if (!Cpf.isValid(cleaned)) {
      throw new DomainException('CPF inválido');
    }

    return new Cpf(cleaned);
  }

  static createWithoutValidation(value: string): Cpf {
    const cleaned = value.replace(/\D/g, '');
    return new Cpf(cleaned);
  }

  static isValid(cpf: string): boolean {
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf)) {
      return false;
    }

    // Validar primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    // Validar segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;

    return true;
  }

  get value(): string {
    return this._value;
  }

  get formatted(): string {
    return `${this._value.slice(0, 3)}.${this._value.slice(3, 6)}.${this._value.slice(6, 9)}-${this._value.slice(9)}`;
  }

  equals(other: Cpf): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
