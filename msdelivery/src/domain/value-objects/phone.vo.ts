import { DomainException } from '../exceptions/domain.exception';

export class Phone {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): Phone {
    if (!value) {
      throw new DomainException('Telefone é obrigatório');
    }
    
    const cleaned = value.replace(/\D/g, '');
    
    // Aceita telefones brasileiros: 10-11 dígitos (sem código de país)
    // ou 12-13 dígitos (com código de país 55)
    if (cleaned.length < 10 || cleaned.length > 13) {
      throw new DomainException('Telefone deve ter entre 10 e 13 dígitos');
    }
    
    return new Phone(cleaned);
  }

  get value(): string {
    return this._value;
  }

  get formatted(): string {
    // Se tem código de país (55), remove para formatar
    let phone = this._value;
    if (phone.length >= 12 && phone.startsWith('55')) {
      phone = phone.slice(2);
    }
    
    if (phone.length === 11) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
    }
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
  }

  equals(other: Phone): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
