import { Controller, Logger, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  IOrderRepository,
  ICustomerDataEnricher,
  IOrderResponseMapper,
  UpdateOrderStatusResponse,
} from './interfaces/grpc-orders.interfaces';
import {
  OrderResponse,
  OrdersListResponse,
  ValidateOrderResponse,
} from './interfaces/grpc-orders.interfaces';

@Controller()
export class GrpcOrdersService {
  private readonly logger = new Logger(GrpcOrdersService.name);

  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('ICustomerDataEnricher')
    private readonly customerEnricher: ICustomerDataEnricher,
    @Inject('IOrderResponseMapper')
    private readonly responseMapper: IOrderResponseMapper,
  ) {}

  @GrpcMethod('OrdersService', 'GetOrder')
  async getOrder(data: { id: number }): Promise<Partial<OrderResponse>> {
    this.logger.log(`[gRPC] Buscando pedido ID: ${data.id}`);

    try {
      const order = await this.orderRepository.findById(data.id);

      if (!order) {
        this.logger.warn(`[gRPC] Pedido não encontrado: ID ${data.id}`);
        return { error: `Pedido com ID ${data.id} não encontrado` };
      }

      const customerData = await this.customerEnricher.enrichWithCustomerData(
        order.customerId,
      );

      const response = this.responseMapper.mapOrderToResponse(
        order,
        customerData,
      );

      this.logger.log(
        `[gRPC] Pedido encontrado: ID ${data.id} - Cliente: ${customerData.name}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `[gRPC] Erro ao buscar pedido ${data.id}: ${this.getErrorMessage(error)}`,
      );
      return { error: `Erro ao buscar pedido: ${this.getErrorMessage(error)}` };
    }
  }

  @GrpcMethod('OrdersService', 'GetOrdersByCustomer')
  async getOrdersByCustomer(data: {
    customerId: number;
  }): Promise<OrdersListResponse> {
    this.logger.log(
      `[gRPC] Buscando pedidos do cliente ID: ${data.customerId}`,
    );

    try {
      const orders = await this.orderRepository.findByCustomerId(
        data.customerId,
      );

      if (!orders || orders.length === 0) {
        this.logger.log(
          `[gRPC] Nenhum pedido encontrado para cliente ${data.customerId}`,
        );
        return { orders: [], total: 0, error: '' };
      }

      const customerData = await this.customerEnricher.enrichWithCustomerData(
        data.customerId,
      );

      const ordersWithData = orders.map((order) =>
        this.responseMapper.mapOrderToResponse(order, customerData),
      );

      this.logger.log(
        `[gRPC] ${ordersWithData.length} pedidos encontrados para cliente ${data.customerId}`,
      );

      return {
        orders: ordersWithData,
        total: ordersWithData.length,
        error: '',
      };
    } catch (error) {
      this.logger.error(
        `[gRPC] Erro ao buscar pedidos do cliente ${data.customerId}: ${this.getErrorMessage(error)}`,
      );
      return {
        orders: [],
        total: 0,
        error: `Erro ao buscar pedidos: ${this.getErrorMessage(error)}`,
      };
    }
  }

  @GrpcMethod('OrdersService', 'ValidateOrder')
  async validateOrder(data: { id: number }): Promise<ValidateOrderResponse> {
    this.logger.log(`[gRPC] Validando pedido ID: ${data.id}`);

    try {
      const orderResponse = await this.getOrder(data);

      if (orderResponse.error) {
        return {
          isValid: false,
          message: orderResponse.error,
          order: null,
        };
      }

      return {
        isValid: true,
        message: 'Pedido válido',
        order: orderResponse as OrderResponse,
      };
    } catch (error) {
      this.logger.error(
        `[gRPC] Erro ao validar pedido ${data.id}: ${this.getErrorMessage(error)}`,
      );
      return {
        isValid: false,
        message: `Erro ao validar pedido: ${this.getErrorMessage(error)}`,
        order: null,
      };
    }
  }

  @GrpcMethod('OrdersService', 'GetOrdersByStatus')
  async getOrdersByStatus(data: { status: string }): Promise<OrdersListResponse> {
    this.logger.log(`[gRPC] Buscando pedidos com status: ${data.status}`);

    try {
      const orders = await this.orderRepository.findByStatus(data.status);

      if (!orders || orders.length === 0) {
        this.logger.log(
          `[gRPC] Nenhum pedido encontrado com status ${data.status}`,
        );
        return { orders: [], total: 0, error: '' };
      }

      const ordersWithData = await Promise.all(
        orders.map(async (order) => {
          const customerData = await this.customerEnricher.enrichWithCustomerData(
            order.customerId,
          );
          return this.responseMapper.mapOrderToResponse(order, customerData);
        }),
      );

      this.logger.log(
        `[gRPC] ${ordersWithData.length} pedidos encontrados com status ${data.status}`,
      );

      return {
        orders: ordersWithData,
        total: ordersWithData.length,
        error: '',
      };
    } catch (error) {
      this.logger.error(
        `[gRPC] Erro ao buscar pedidos com status ${data.status}: ${this.getErrorMessage(error)}`,
      );
      return {
        orders: [],
        total: 0,
        error: `Erro ao buscar pedidos: ${this.getErrorMessage(error)}`,
      };
    }
  }

  @GrpcMethod('OrdersService', 'UpdateOrderStatus')
  async updateOrderStatus(data: {
    orderId: number;
    status: string;
  }): Promise<UpdateOrderStatusResponse> {
    this.logger.log(
      `[gRPC] Atualizando status do pedido ${data.orderId} para ${data.status}`,
    );

    try {
      const updatedOrder = await this.orderRepository.updateStatus(
        data.orderId,
        data.status,
      );

      if (!updatedOrder) {
        return {
          success: false,
          message: `Pedido ${data.orderId} não encontrado`,
          order: null,
        };
      }

      const customerData = await this.customerEnricher.enrichWithCustomerData(
        updatedOrder.customerId,
      );

      const response = this.responseMapper.mapOrderToResponse(
        updatedOrder,
        customerData,
      );

      this.logger.log(
        `[gRPC] Status do pedido ${data.orderId} atualizado para ${data.status}`,
      );

      return {
        success: true,
        message: 'Status atualizado com sucesso',
        order: response,
      };
    } catch (error) {
      this.logger.error(
        `[gRPC] Erro ao atualizar status do pedido ${data.orderId}: ${this.getErrorMessage(error)}`,
      );
      return {
        success: false,
        message: `Erro ao atualizar status: ${this.getErrorMessage(error)}`,
        order: null,
      };
    }
  }

  /**
   * Extrai mensagem de erro de forma type-safe
   * @private
   */
  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Erro desconhecido';
  }
}
