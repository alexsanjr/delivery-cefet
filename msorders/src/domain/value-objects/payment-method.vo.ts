import { DomainException } from '../../shared/exceptions';
import { ValueObject } from '../../shared/interfaces';

export enum PaymentMethodEnum {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  CASH = 'CASH',
}

interface PaymentMethodProps {
  value: PaymentMethodEnum;
}

export class PaymentMethod extends ValueObject<PaymentMethodProps> {
  private constructor(props: PaymentMethodProps) {
    super(props);
  }

  static create(value: PaymentMethodEnum): PaymentMethod {
    if (!Object.values(PaymentMethodEnum).includes(value)) {
      throw new DomainException(`Invalid payment method: ${value}`);
    }

    return new PaymentMethod({ value });
  }

  static creditCard(): PaymentMethod {
    return new PaymentMethod({ value: PaymentMethodEnum.CREDIT_CARD });
  }

  static debitCard(): PaymentMethod {
    return new PaymentMethod({ value: PaymentMethodEnum.DEBIT_CARD });
  }

  static pix(): PaymentMethod {
    return new PaymentMethod({ value: PaymentMethodEnum.PIX });
  }

  static cash(): PaymentMethod {
    return new PaymentMethod({ value: PaymentMethodEnum.CASH });
  }

  get value(): PaymentMethodEnum {
    return this.props.value;
  }

  isCreditCard(): boolean {
    return this.value === PaymentMethodEnum.CREDIT_CARD;
  }

  isDebitCard(): boolean {
    return this.value === PaymentMethodEnum.DEBIT_CARD;
  }

  isPix(): boolean {
    return this.value === PaymentMethodEnum.PIX;
  }

  isCash(): boolean {
    return this.value === PaymentMethodEnum.CASH;
  }

  requiresOnlinePayment(): boolean {
    return this.isCreditCard() || this.isDebitCard() || this.isPix();
  }

  toString(): string {
    return this.value;
  }
}
