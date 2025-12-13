import { Injectable, Logger } from '@nestjs/common';
import { IOrdersClient, OrderData } from '../../../../application/ports/out/orders-client.port';
import { OrdersRabbitMQClient } from '../../../../rabbitmq/orders-rabbitmq.client';

/**
 * Adapter RabbitMQ para comunicação com MSOrders
 * Substitui o GrpcOrdersClientAdapter, implementando IOrdersClient
 */
@Injectable()
export class RabbitMQOrdersClientAdapter implements IOrdersClient {
  private readonly logger = new Logger(RabbitMQOrdersClientAdapter.name);

  constructor(private readonly ordersRabbitMQClient: OrdersRabbitMQClient) {}

  async getOrder(orderId: number): Promise<OrderData> {
    this.logger.log(`🔄 Buscando pedido ${orderId} via RabbitMQ (Adapter)`);
    
    const orderResponse = await this.ordersRabbitMQClient.getOrder(orderId);
    
    if (!orderResponse || orderResponse.error) {
      this.logger.error(`❌ Erro ao buscar pedido: ${orderResponse?.error}`);
      throw new Error(orderResponse?.error || 'Pedido não encontrado');
    }
    
    // Converter OrderResponse (Protobuf) para OrderData (domain model)
    const orderData: OrderData = {
      id: orderResponse.id,
      customerId: orderResponse.customerId,
      customerName: orderResponse.customerName,
      deliveryAddress: orderResponse.deliveryAddress ? {
        street: orderResponse.deliveryAddress.street,
        number: orderResponse.deliveryAddress.number,
        complement: orderResponse.deliveryAddress.complement || '',
        neighborhood: orderResponse.deliveryAddress.neighborhood,
        city: orderResponse.deliveryAddress.city,
        state: orderResponse.deliveryAddress.state,
        zipCode: orderResponse.deliveryAddress.zipCode,
        latitude: orderResponse.deliveryAddress.latitude,
        longitude: orderResponse.deliveryAddress.longitude,
      } : null,
      status: orderResponse.status,
      totalAmount: orderResponse.total,
    };
    
    this.logger.log(`✅ Pedido ${orderId} convertido para OrderData`);
    return orderData;
  }

  async updateOrderStatus(orderId: number, status: string): Promise<void> {
    this.logger.log(`🔄 Atualizando status do pedido ${orderId} para ${status} via RabbitMQ`);
    
    const response = await this.ordersRabbitMQClient.updateOrderStatus(orderId, status);
    
    if (!response.success) {
      this.logger.error(`❌ Erro ao atualizar status: ${response.error}`);
      throw new Error(response.error || 'Falha ao atualizar status');
    }
    
    this.logger.log(`✅ Status do pedido ${orderId} atualizado para ${status}`);
  }
}
