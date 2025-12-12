import { PaymentMethodEnum } from '../../domain/value-objects/payment-method.vo';

export class CreateOrderItemDto {
  productId: number;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}

export class CreateOrderDto {
  customerId: number;
  items: CreateOrderItemDto[];
  paymentMethod: PaymentMethodEnum;
  deliveryAddress: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    complement?: string;
    latitude?: number;
    longitude?: number;
  };
  deliveryFee?: number;
}
