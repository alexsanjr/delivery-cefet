import { CreateOrderInput } from './create-order.input';
import { PartialType } from '@nestjs/mapped-types';
import { OrderStatus } from 'generated/prisma';

export class UpdateOrderInput extends PartialType(CreateOrderInput) {
  id: number;
  status?: OrderStatus;
}
