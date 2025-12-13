import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import * as protobuf from 'protobufjs';
import * as path from 'path';

/**
 * RabbitMQ Client for communicating with MSOrders.
 */
@Injectable()
export class OrdersRabbitMQClient implements OnModuleInit {
  private readonly logger = new Logger(OrdersRabbitMQClient.name);
  private GetOrderRequestProto: protobuf.Type;
  private OrderResponseProto: protobuf.Type;
  private GetOrdersByStatusRequestProto: protobuf.Type;
  private UpdateOrderStatusRequestProto: protobuf.Type;

  constructor(private readonly rabbitmqService: RabbitMQService) {}

  async onModuleInit() {
    try {
      const protoPath = path.join(__dirname, '../proto/orders.proto');
      const root = await protobuf.load(protoPath);

      this.GetOrderRequestProto = root.lookupType('orders.GetOrderRequest');
      this.OrderResponseProto = root.lookupType('orders.OrderResponse');
      this.GetOrdersByStatusRequestProto = root.lookupType('orders.GetOrdersByStatusRequest');
      this.UpdateOrderStatusRequestProto = root.lookupType('orders.UpdateOrderStatusRequest');

      this.logger.log('Protobuf schema loaded for orders');
    } catch (error) {
      this.logger.error(`Failed to load Protobuf schema: ${error.message}`);
      throw error;
    }
  }

  async getOrder(orderId: number): Promise<any> {
    this.logger.debug(`Requesting order ${orderId} via RabbitMQ`);

    try {
      const request = this.GetOrderRequestProto.create({ id: orderId });
      const requestBuffer = this.GetOrderRequestProto.encode(request).finish();

      const responseBuffer = await this.rabbitmqService.rpcCall(
        'orders.get.queue',
        Buffer.from(requestBuffer),
        10000,
      );
      
      const response = this.OrderResponseProto.decode(responseBuffer);
      const responseObj = this.OrderResponseProto.toObject(response, {
        longs: Number,
        enums: String,
        bytes: String,
        defaults: true,
      });
      
      if (responseObj.error) {
        this.logger.error(`Error fetching order ${orderId}: ${responseObj.error}`);
        return { error: responseObj.error };
      }

      if (responseObj.id === 0) {
        this.logger.warn(`Order ${orderId} not found`);
        return null;
      }

      return responseObj;
    } catch (error) {
      this.logger.error(`Error fetching order via RabbitMQ: ${error.message}`);
      throw error;
    }
  }

  async getOrdersByStatus(status: string): Promise<any[]> {
    this.logger.debug(`Requesting orders with status ${status} via RabbitMQ`);

    try {
      const request = this.GetOrdersByStatusRequestProto.create({ status });
      const requestBuffer = this.GetOrdersByStatusRequestProto.encode(request).finish();

      const responseBuffer = await this.rabbitmqService.rpcCall(
        'orders.by-status.queue',
        Buffer.from(requestBuffer),
        10000,
      );

      const OrdersListProto = protobuf.Type.fromJSON('OrdersListResponse', {
        fields: {
          orders: { type: 'OrderResponse', rule: 'repeated', id: 1 },
          total: { type: 'int32', id: 2 },
        }
      });

      const response = OrdersListProto.decode(responseBuffer);
      const responseObj = OrdersListProto.toObject(response, {
        longs: Number,
        enums: String,
        bytes: String,
      });

      return responseObj.orders || [];
    } catch (error) {
      this.logger.error(`Error fetching orders by status via RabbitMQ: ${error.message}`);
      throw error;
    }
  }

  async updateOrderStatus(orderId: number, status: string): Promise<any> {
    this.logger.debug(`Updating order ${orderId} status to ${status} via RabbitMQ`);

    try {
      const request = this.UpdateOrderStatusRequestProto.create({ orderId, status });
      const requestBuffer = this.UpdateOrderStatusRequestProto.encode(request).finish();

      const responseBuffer = await this.rabbitmqService.rpcCall(
        'orders.update-status.queue',
        Buffer.from(requestBuffer),
        10000,
      );

      const UpdateStatusResponseProto = protobuf.Type.fromJSON('UpdateOrderStatusResponse', {
        fields: {
          success: { type: 'bool', id: 1 },
          orderId: { type: 'int32', id: 2 },
          newStatus: { type: 'string', id: 3 },
          error: { type: 'string', id: 4 },
        }
      });

      const response = UpdateStatusResponseProto.decode(responseBuffer);
      const responseObj = UpdateStatusResponseProto.toObject(response);

      if (!responseObj.success) {
        this.logger.error(`Error updating status: ${responseObj.error}`);
        return { error: responseObj.error };
      }

      return responseObj;
    } catch (error) {
      this.logger.error(`Error updating status via RabbitMQ: ${error.message}`);
      throw error;
    }
  }
}
