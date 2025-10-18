import { CreateOrderInput } from './create-order.input';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateOrderInput extends PartialType(CreateOrderInput) {
  id: number;
}
