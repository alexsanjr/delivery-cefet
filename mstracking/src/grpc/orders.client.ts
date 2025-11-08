import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';

interface UpdateOrderStatusRequest {
    orderId: number;
    status: string;
    notes?: string;
}

interface UpdateOrderStatusResponse {
    success: boolean;
    message: string;
    order: any;
}

interface GetOrderRequest {
    id: number;
}

interface GetOrderResponse {
    id: number;
    customerId: number;
    customerName: string;
    customerEmail: string;
    status: string;
    error?: string;
}

interface IOrdersService {
    UpdateOrderStatus(data: UpdateOrderStatusRequest): Observable<UpdateOrderStatusResponse>;
    GetOrder(data: GetOrderRequest): Observable<GetOrderResponse>;
}

@Injectable()
export class OrdersClient implements OnModuleInit {
    private readonly logger = new Logger(OrdersClient.name);
    private ordersService: IOrdersService;

    constructor(
        @Inject('ORDERS_PACKAGE') private readonly client: ClientGrpc,
    ) { }

    onModuleInit() {
        this.ordersService = this.client.getService<IOrdersService>('OrdersService');
        this.logger.log('OrdersClient initialized');
    }

    async updateOrderStatus(
        orderId: number,
        status: string,
        notes?: string,
    ): Promise<UpdateOrderStatusResponse> {
        try {
            const response = await firstValueFrom(
                this.ordersService.UpdateOrderStatus({
                    orderId,
                    status,
                    notes,
                }),
            );

            this.logger.log(
                `Order status updated: orderId=${orderId}, status=${status}`,
            );

            return response;
        } catch (error) {
            this.logger.error(
                `Failed to update order status: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }

    async markAsDelivered(orderId: number): Promise<UpdateOrderStatusResponse> {
        return this.updateOrderStatus(orderId, 'DELIVERED', 'Pedido entregue com sucesso');
    }

    async getOrder(orderId: number): Promise<GetOrderResponse> {
        try {
            const response = await firstValueFrom(
                this.ordersService.GetOrder({ id: orderId }),
            );

            if (response.error) {
                this.logger.warn(`Order not found: orderId=${orderId}, error=${response.error}`);
                throw new Error(response.error);
            }

            return response;
        } catch (error) {
            this.logger.error(
                `Failed to get order: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }
}