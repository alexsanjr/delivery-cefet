import { Order } from '../aggregates/order/order.aggregate';

export interface IOrderRepository {
  save(order: Order): Promise<Order>;
  findById(id: number): Promise<Order | null>;
  findByCustomerId(customerId: number): Promise<Order[]>;
  findAll(limit?: number, offset?: number): Promise<Order[]>;
  update(order: Order): Promise<Order>;
  delete(id: number): Promise<void>;
}

export const ORDER_REPOSITORY = Symbol('IOrderRepository');
