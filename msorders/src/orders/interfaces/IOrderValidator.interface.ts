import { CreateOrderInput } from '../dto/create-order.input';
import { UpdateOrderInput } from '../dto/update-order.input';

export interface IOrderValidator {
  validateCreateOrderInput(input: CreateOrderInput): void;
  validateUpdateOrderInput(input: UpdateOrderInput): Promise<void>;
}
