import { Injectable } from '@nestjs/common';
import { OrdersDatasource } from '../../orders/orders.datasource';
import { IOrderRepository } from '../interfaces/grpc-orders.interfaces';

@Injectable()
export class OrderRepositoryAdapter implements IOrderRepository {
  constructor(private readonly ordersDatasource: OrdersDatasource) {}

  async findById(id: number): Promise<any> {
    return this.ordersDatasource.findOne(id);
  }

  async findByCustomerId(customerId: number): Promise<any[]> {
    return this.ordersDatasource.findByCustomer(customerId);
  }

  async findByStatus(status: string): Promise<any[]> {
    return this.ordersDatasource.findByStatus(status);
  }

  async updateStatus(id: number, status: string): Promise<any> {
    return this.ordersDatasource.updateStatus({ id, status: status as any });
  }
}
