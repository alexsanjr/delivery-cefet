import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { IOrdersClient, OrderData } from '../../../../application/ports/out/orders-client.port';

interface OrdersGrpcService {
  getOrder(data: { id: number }): Promise<any>;
  getOrdersByStatus(data: { status: string }): Promise<any>;
  updateOrderStatus(data: { id: number; status: string }): Promise<any>;
}

@Injectable()
export class GrpcOrdersClientAdapter implements IOrdersClient, OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'orders',
      protoPath: '/app/proto/orders.proto',
      url: process.env.ORDERS_GRPC_URL || 'msorders:50052',
    },
  })
  private client: ClientGrpc;

  private ordersService: OrdersGrpcService;

  onModuleInit() {
    this.ordersService = this.client.getService<OrdersGrpcService>('OrdersService');
  }

  async getOrder(orderId: number): Promise<OrderData | null> {
    try {
      const response: any = await firstValueFrom(
        this.ordersService.getOrder({ id: orderId }) as any,
      );

      if (!response || response.error) {
        return null;
      }

      return {
        id: response.id,
        customerId: response.customerId,
        customerName: response.customerName,
        deliveryAddress: response.deliveryAddress ? {
          street: response.deliveryAddress.street,
          number: response.deliveryAddress.number,
          complement: response.deliveryAddress.complement,
          neighborhood: response.deliveryAddress.neighborhood,
          city: response.deliveryAddress.city,
          state: response.deliveryAddress.state,
          zipCode: response.deliveryAddress.zipCode,
          latitude: response.deliveryAddress.latitude,
          longitude: response.deliveryAddress.longitude,
        } : undefined,
        status: response.status,
        totalAmount: response.totalAmount,
      } as OrderData;
    } catch (error: any) {
      console.error(`Erro ao buscar pedido ${orderId}:`, error.message);
      return null;
    }
  }
}
