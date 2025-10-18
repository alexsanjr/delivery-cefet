import { PaymentMethod } from 'generated/prisma';

export class CreateOrderInput {
  customerId!: number;
  //items?: OrderItemInput[];
  //deliveryAddress?: DeliveryAddressInput;
  estimatedDeliveryTime!: number;
  paymentMethod!: PaymentMethod;
  subtotal!: number;
  deliveryFee!: number;
  total!: number;
}
