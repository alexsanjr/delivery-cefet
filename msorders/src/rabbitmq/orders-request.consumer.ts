import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import * as protobuf from 'protobufjs';
import * as path from 'path';
import { GetOrderUseCase } from '../application/use-cases/get-order/get-order.use-case';
import { UpdateOrderStatusUseCase } from '../application/use-cases/update-order-status/update-order-status.use-case';
import type { IOrderRepository } from '../domain/repositories/order.repository.interface';
import { ORDER_REPOSITORY } from '../domain/repositories/order.repository.interface';

/**
 * Consumer for order RPC requests.
 */
@Injectable()
export class OrdersRequestConsumer implements OnModuleInit {
  private readonly logger = new Logger(OrdersRequestConsumer.name);
  private OrderProto: protobuf.Type;
  private GetOrderRequestProto: protobuf.Type;
  private GetOrdersByStatusRequestProto: protobuf.Type;
  private UpdateOrderStatusRequestProto: protobuf.Type;

  constructor(
    private readonly rabbitmqService: RabbitMQService,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: IOrderRepository,
  ) {}

  async onModuleInit() {
    try {
      const protoPath = path.join(__dirname, '../grpc/orders.proto');
      const root = await protobuf.load(protoPath);

      this.OrderProto = root.lookupType('orders.OrderResponse');
      this.GetOrderRequestProto = root.lookupType('orders.GetOrderRequest');
      this.GetOrdersByStatusRequestProto = root.lookupType('orders.GetOrdersByStatusRequest');
      this.UpdateOrderStatusRequestProto = root.lookupType('orders.UpdateOrderStatusRequest');

      this.logger.log('Protobuf schema loaded');

      await this.setupGetOrderConsumer();
      await this.setupGetOrdersByStatusConsumer();
      await this.setupUpdateOrderStatusConsumer();
    } catch (error) {
      this.logger.error(`Failed to init OrdersRequestConsumer: ${error.message}`);
      throw error;
    }
  }

  private async setupGetOrderConsumer() {
    await this.rabbitmqService.consumeRpc(
      'orders.get.queue',
      this.GetOrderRequestProto,
      async (request: any) => {
        this.logger.debug(`Fetching order ${request.id}`);

        try {
          const orderDto = await this.getOrderUseCase.execute(request.id);

          if (!orderDto) {
            return this.OrderProto.create({
              id: 0,
              error: `Order ${request.id} not found`,
            });
          }

          const orderData = {
            id: orderDto.id,
            customerId: orderDto.customerId,
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            customerIsPremium: false,
            deliveryAddress: orderDto.deliveryAddress ? this.parseDeliveryAddress(orderDto.deliveryAddress) : null,
            items: orderDto.items?.map(item => ({
              id: item.id,
              orderId: orderDto.id,
              productId: item.productId,
              productName: item.productName || '',
              productDescription: item.description || '',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.subtotal,
              createdAt: '',
            })) || [],
            subtotal: orderDto.subtotal,
            deliveryFee: orderDto.deliveryFee,
            total: orderDto.total,
            estimatedDeliveryTime: orderDto.estimatedDeliveryTime,
            paymentMethod: orderDto.paymentMethod,
            status: orderDto.status,
            createdAt: orderDto.createdAt?.toISOString() || '',
            updatedAt: orderDto.updatedAt?.toISOString() || '',
          };

          return this.OrderProto.create(orderData);
        } catch (error) {
          this.logger.error(`Error fetching order ${request.id}: ${error.message}`);
          return this.OrderProto.create({
            id: 0,
            error: error.message,
          });
        }
      },
    );
  }

  private parseDeliveryAddress(addressStr: string): any {
    try {
      const address = JSON.parse(addressStr);
      return {
        street: address.street || '',
        number: address.number || '',
        complement: address.complement || '',
        neighborhood: address.neighborhood || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        latitude: address.latitude || 0,
        longitude: address.longitude || 0,
      };
    } catch (e) {
      return { street: addressStr };
    }
  }

  private async setupGetOrdersByStatusConsumer() {
    await this.rabbitmqService.consumeRpc(
      'orders.by-status.queue',
      this.GetOrdersByStatusRequestProto,
      async (request: any) => {
        this.logger.debug(`Fetching orders with status: ${request.status}`);

        try {
          const orders = await this.orderRepository.findAll();
          const filteredOrders = orders.filter(order => 
            order.status.value === request.status
          );

          this.logger.debug(`Found ${filteredOrders.length} orders`);

          const OrdersListProto = protobuf.Type.fromJSON('OrdersListResponse', {
            fields: {
              orders: { type: 'OrderResponse', rule: 'repeated', id: 1 },
              total: { type: 'int32', id: 2 },
            }
          });

          return OrdersListProto.create({
            orders: filteredOrders.map(o => ({ id: o.id, status: o.status.value })),
            total: filteredOrders.length,
          });
        } catch (error) {
          this.logger.error(`Error fetching orders by status: ${error.message}`);
          throw error;
        }
      },
    );
  }

  private async setupUpdateOrderStatusConsumer() {
    await this.rabbitmqService.consumeRpc(
      'orders.update-status.queue',
      this.UpdateOrderStatusRequestProto,
      async (request: any) => {
        this.logger.debug(`Updating order ${request.orderId} to status ${request.status}`);

        try {
          const orderDto = await this.updateOrderStatusUseCase.execute({
            orderId: request.orderId,
            newStatus: request.status,
          });

          const UpdateStatusResponseProto = protobuf.Type.fromJSON('UpdateOrderStatusResponse', {
            fields: {
              success: { type: 'bool', id: 1 },
              orderId: { type: 'int32', id: 2 },
              newStatus: { type: 'string', id: 3 },
              error: { type: 'string', id: 4 },
            }
          });

          return UpdateStatusResponseProto.create({
            success: true,
            orderId: orderDto.id,
            newStatus: orderDto.status,
          });
        } catch (error) {
          this.logger.error(`Error updating order status: ${error.message}`);
          
          const UpdateStatusResponseProto = protobuf.Type.fromJSON('UpdateOrderStatusResponse', {
            fields: {
              success: { type: 'bool', id: 1 },
              orderId: { type: 'int32', id: 2 },
              newStatus: { type: 'string', id: 3 },
              error: { type: 'string', id: 4 },
            }
          });

          return UpdateStatusResponseProto.create({
            success: false,
            orderId: request.orderId,
            error: error.message,
          });
        }
      },
    );
  }
}
