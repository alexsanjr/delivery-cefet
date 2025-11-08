import { Injectable } from '@nestjs/common';
import {
  IOrderResponseMapper,
  OrderResponse,
  OrderItemResponse,
  DeliveryAddressResponse,
  CustomerData,
} from '../interfaces/grpc-orders.interfaces';

@Injectable()
export class OrderResponseMapperService implements IOrderResponseMapper {
  mapOrderToResponse(order: any, customerData: CustomerData): OrderResponse {
    const primaryAddress = this.getPrimaryAddress(customerData.addresses);

    return {
      id: order.id,
      customerId: order.customerId,

      // Dados do cliente
      customerName: customerData.name,
      customerEmail: customerData.email,
      customerPhone: customerData.phone,
      customerIsPremium: customerData.isPremium,

      // Endereço de entrega
      deliveryAddress: this.mapAddressToResponse(primaryAddress),

      // Items do pedido
      items: order.items.map((item: any) => this.mapOrderItemToResponse(item)),

      // Valores financeiros
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),

      // Informações adicionais
      estimatedDeliveryTime: order.estimatedDeliveryTime || 0,
      paymentMethod: order.paymentMethod,
      status: order.status,

      // Timestamps em timezone de Brasília
      createdAt: this.formatDateToBrasilia(order.createdAt),
      updatedAt: this.formatDateToBrasilia(order.updatedAt),

      error: '',
    };
  }

  // Mapeia um item do pedido para o formato de resposta
  mapOrderItemToResponse(item: any): OrderItemResponse {
    return {
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productName: item.name || '',
      productDescription: item.description || '',
      quantity: item.quantity,
      unitPrice: Number(item.price),
      totalPrice: Number(item.price) * item.quantity,
      createdAt: new Date().toISOString(),
    };
  }

  // Mapeia um endereço para o formato de resposta
  mapAddressToResponse(address: any): DeliveryAddressResponse {
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
  }

  private getPrimaryAddress(addresses: any[]): any {
    if (!addresses || addresses.length === 0) {
      return {};
    }

    const primaryAddress = addresses.find((addr) => addr.isPrimary);
    return primaryAddress || addresses[0] || {};
  }

  private formatDateToBrasilia(date: Date): string {
    return date.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });
  }
}
