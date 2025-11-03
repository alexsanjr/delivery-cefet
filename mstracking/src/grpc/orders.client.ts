import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc } from '@nestjs/microservices';
import { join } from 'path';
import { Observable } from 'rxjs';

interface OrdersGrpcService {
  GetOrder(request: { order_id: string }): Observable<any>;
  UpdateOrderStatus(request: { order_id: string; status: string }): Observable<any>;
}

@Injectable()
export class OrdersGrpcClient implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'orders',
      protoPath: join(__dirname, '../../shared/protos/orders.proto'),
      url: 'localhost:50051',
    },
  })
  private client: ClientGrpc;

  private ordersService: OrdersGrpcService;

  onModuleInit() {
    this.ordersService = this.client.getService<OrdersGrpcService>('OrdersService');
  }

  async getOrder(orderId: string): Promise<any> {
    return this.ordersService.GetOrder({ order_id: orderId }).toPromise();
  }

  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    return this.ordersService.UpdateOrderStatus({ order_id: orderId, status }).toPromise();
  }
}