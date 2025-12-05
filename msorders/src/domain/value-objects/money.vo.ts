import { DomainException } from '../../shared/exceptions';
import { ValueObject } from '../../shared/interfaces';

interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  static create(amount: number, currency: string = 'BRL'): Money {
    if (amount < 0) {
      throw new DomainException('Money amount cannot be negative');
    }

    if (!currency || currency.length !== 3) {
      throw new DomainException('Currency must be a valid 3-letter code');
    }

    return new Money({ amount, currency });
  }

  static zero(currency: string = 'BRL'): Money {
    return new Money({ amount: 0, currency });
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new DomainException('Cannot add money with different currencies');
    }

    return Money.create(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return Money.create(this.amount * factor, this.currency);
  }

  isGreaterThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new DomainException(
        'Cannot compare money with different currencies',
      );
    }

    return this.amount > other.amount;
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}
