import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

interface OrdersService {
  getOrder(data: { id: number }): Promise<any>;
  getOrdersByStatus(data: { status: string }): Promise<any>;
  updateOrderStatus(data: { id: number; status: string }): Promise<any>;
}

@Injectable()
export class OrdersClient implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'orders',
      protoPath: '/app/proto/orders.proto',
      url: process.env.ORDERS_GRPC_URL || 'msorders:50052',
    },
  })
  private client: ClientGrpc;

  private ordersService: OrdersService;

  onModuleInit() {
    this.ordersService = this.client.getService<OrdersService>('OrdersService');
  }

  async getOrder(orderId: number) {
    return firstValueFrom(
      this.ordersService.getOrder({ id: orderId }) as any
    );
  }

  async getOrdersByStatus(status: string) {
    return firstValueFrom(
      this.ordersService.getOrdersByStatus({ status }) as any
    );
  }

  async updateOrderStatus(orderId: number, status: string) {
    return firstValueFrom(
      this.ordersService.updateOrderStatus({ id: orderId, status }) as any
    );
  }
}
