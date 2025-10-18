import { PaymentMethod } from 'generated/prisma';

export class CreateOrderInput {
  customerId!: number;
  //items?: OrderItemInput[];
  //deliveryAddress?: DeliveryAddressInput;
  paymentMethod!: PaymentMethod;
}
