import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { OrderServicePort } from '../../domain/ports/external-services.port';

interface OrderResponse {
    id: number;
    customerId: number;
    status: string;
}

interface IOrdersService {
    GetOrder(data: { orderId: number }): Observable<OrderResponse>;
}

@Injectable()
export class OrdersGrpcAdapter implements OrderServicePort, OnModuleInit {
    private readonly logger = new Logger(OrdersGrpcAdapter.name);
    private ordersService: IOrdersService;

    constructor(@Inject('ORDERS_PACKAGE') private client: ClientGrpc) {}

    onModuleInit() {
        this.ordersService = this.client.getService<IOrdersService>('OrdersService');
    }

    async getOrder(orderId: number): Promise<{ id: number; customerId: number; status: string } | null> {
        try {
            const response = await firstValueFrom(
                this.ordersService.GetOrder({ orderId })
            );
            return response;
        } catch (error) {
            this.logger.error(`Failed to get order ${orderId}:`, error);
            return null;
        }
    }
}
