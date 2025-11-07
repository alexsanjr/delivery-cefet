import { OrderStatus } from '../../../generated/prisma';
import { IsInt, IsEnum } from 'class-validator';

export class UpdateOrderInput {
  @IsInt()
  id: number;

  @IsEnum(OrderStatus)
  status: OrderStatus;
}
