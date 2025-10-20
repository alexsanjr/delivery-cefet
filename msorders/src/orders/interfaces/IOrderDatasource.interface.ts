import { Order } from 'generated/prisma';
import { CreateOrderInput } from '../dto/create-order.input';
import { UpdateOrderInput } from '../dto/update-order.input';

export interface IOrderDatasource {
  create(orderData: CreateOrderInput): Promise<Order>;
  findById(id: number): Promise<Order | null>;
  findAll(): Promise<Order[]>;
  findByCustomer(customerId: number): Promise<Order[]>;
  updateStatus(orderData: UpdateOrderInput): Promise<Order>;
}
