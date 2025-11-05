import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { OrdersService } from '../orders/orders.service';
import { OrdersDatasource } from '../orders/orders.datasource';
import { CustomersClient } from '../grpc/customers.client';

@Controller()
export class GrpcOrdersService {
  private readonly logger = new Logger(GrpcOrdersService.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly ordersDatasource: OrdersDatasource,
    private readonly customersClient: CustomersClient,
  ) {}

  @GrpcMethod('OrdersService', 'GetOrder')
  async getOrder(data: { id: number }) {
    this.logger.log(`[gRPC] Buscando pedido ID: ${data.id}`);

    try {
      const order = await this.ordersDatasource.findOne(data.id);

      if (!order) {
        this.logger.warn(`[gRPC] Pedido não encontrado: ID ${data.id}`);
        return {
          error: `Pedido com ID ${data.id} não encontrado`,
        };
      }

      let customerData: any = {
        name: '',
        email: '',
        phone: '',
        isPremium: false,
        addresses: [],
      };

      try {
        customerData = await this.customersClient.getCustomer(order.customerId);
        this.logger.log(
          `[gRPC] Dados do cliente ${order.customerId} obtidos via gRPC`,
        );
      } catch (error) {
        this.logger.warn(
          `[gRPC] Não foi possível buscar dados do cliente ${order.customerId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        );
      }

      // Pega o endereço principal do cliente para usar como delivery address
      const primaryAddress =
        customerData.addresses?.find((addr: any) => addr.isPrimary) ||
        customerData.addresses?.[0] ||
        {};

      // Items do pedido
      const items = order.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.name || '',
        productDescription: item.description || '',
        quantity: item.quantity,
        unitPrice: Number(item.price),
        totalPrice: Number(item.price) * item.quantity,
        createdAt: new Date().toISOString(),
      }));

      // Monta a resposta completa
      const response = {
        id: order.id,
        customerId: order.customerId,

        customerName: customerData.name || '',
        customerEmail: customerData.email || '',
        customerPhone: customerData.phone || '',
        customerIsPremium: customerData.isPremium || false,

        deliveryAddress: {
          street: primaryAddress.street || '',
          number: primaryAddress.number || '',
          complement: primaryAddress.complement || '',
          neighborhood: primaryAddress.neighborhood || '',
          city: primaryAddress.city || '',
          state: primaryAddress.state || '',
          zipCode: primaryAddress.zipCode || '',
        },

        items,

        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        total: Number(order.total),

        estimatedDeliveryTime: order.estimatedDeliveryTime || 0,
        paymentMethod: order.paymentMethod,
        status: order.status,

        // Timestamps
        createdAt: order.createdAt.toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
        }),
        updatedAt: order.updatedAt.toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
        }),

        error: '',
      };

      this.logger.log(
        `[gRPC] Pedido encontrado: ID ${data.id} - Cliente: ${customerData.name}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `[gRPC] Erro ao buscar pedido ${data.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      return {
        error: `Erro ao buscar pedido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  @GrpcMethod('OrdersService', 'GetOrdersByCustomer')
  async getOrdersByCustomer(data: { customerId: number }) {
    this.logger.log(
      `[gRPC] Buscando pedidos do cliente ID: ${data.customerId}`,
    );

    try {
      const orders = await this.ordersDatasource.findByCustomer(
        data.customerId,
      );

      if (!orders || orders.length === 0) {
        this.logger.log(
          `[gRPC] Nenhum pedido encontrado para cliente ${data.customerId}`,
        );
        return {
          orders: [],
          total: 0,
          error: '',
        };
      }

      let customerData: any = {
        name: '',
        email: '',
        phone: '',
        isPremium: false,
        addresses: [],
      };

      try {
        customerData = await this.customersClient.getCustomer(data.customerId);
      } catch (error) {
        this.logger.warn(
          `[gRPC] Não foi possível buscar dados do cliente ${data.customerId}`,
        );
      }

      const primaryAddress =
        customerData.addresses?.find((addr: any) => addr.isPrimary) ||
        customerData.addresses?.[0] ||
        {};

      // Mapeia todos os pedidos
      const ordersWithItems = orders.map((order) => ({
        id: order.id,
        customerId: order.customerId,
        customerName: customerData.name || '',
        customerEmail: customerData.email || '',
        customerPhone: customerData.phone || '',
        customerIsPremium: customerData.isPremium || false,
        deliveryAddress: {
          street: primaryAddress.street || '',
          number: primaryAddress.number || '',
          complement: primaryAddress.complement || '',
          neighborhood: primaryAddress.neighborhood || '',
          city: primaryAddress.city || '',
          state: primaryAddress.state || '',
          zipCode: primaryAddress.zipCode || '',
        },
        items: order.items.map((item) => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          productName: item.name || '',
          productDescription: item.description || '',
          quantity: item.quantity,
          unitPrice: Number(item.price),
          totalPrice: Number(item.price) * item.quantity,
          createdAt: new Date().toISOString(),
        })),
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        total: Number(order.total),
        estimatedDeliveryTime: order.estimatedDeliveryTime || 0,
        paymentMethod: order.paymentMethod,
        status: order.status,
        createdAt: order.createdAt.toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
        }),
        updatedAt: order.updatedAt.toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
        }),
        error: '',
      }));

      this.logger.log(
        `[gRPC] ${ordersWithItems.length} pedidos encontrados para cliente ${data.customerId}`,
      );

      return {
        orders: ordersWithItems,
        total: ordersWithItems.length,
        error: '',
      };
    } catch (error) {
      this.logger.error(
        `[gRPC] Erro ao buscar pedidos do cliente ${data.customerId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      return {
        orders: [],
        total: 0,
        error: `Erro ao buscar pedidos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  @GrpcMethod('OrdersService', 'ValidateOrder')
  async validateOrder(data: { id: number }) {
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
        order: orderResponse,
      };
    } catch (error) {
      this.logger.error(
        `[gRPC] Erro ao validar pedido ${data.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      return {
        isValid: false,
        message: `Erro ao validar pedido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        order: null,
      };
    }
  }
}
