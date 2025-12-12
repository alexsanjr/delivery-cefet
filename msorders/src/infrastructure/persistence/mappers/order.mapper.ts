import type {
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  OrderStatus as PrismaOrderStatus,
  PaymentMethod as PrismaPaymentMethod,
} from '../../../../generated/prisma';
import { Order } from '../../../domain/aggregates/order/order.aggregate';
import { OrderItem } from '../../../domain/entities/order-item.entity';
import { Money } from '../../../domain/value-objects/money.vo';
import {
  OrderStatus,
  OrderStatusEnum,
} from '../../../domain/value-objects/order-status.vo';
import {
  PaymentMethod,
  PaymentMethodEnum,
} from '../../../domain/value-objects/payment-method.vo';
import { Address } from '../../../domain/value-objects/address.vo';

type PrismaOrderWithItems = PrismaOrder & {
  items: PrismaOrderItem[];
};

export class OrderMapper {
  /**
   * Converte do modelo Prisma (banco de dados) para o modelo de Domínio (DDD)
   * NOTA: O schema do Prisma não tem campos de endereço ainda, então usamos valores padrão
   */
  static toDomain(prismaOrder: PrismaOrderWithItems): Order {
    const items = prismaOrder.items.map((prismaItem) =>
      OrderItem.reconstitute(prismaItem.id, {
        productId: prismaItem.productId,
        productName: prismaItem.name, // Prisma usa 'name'
        description: prismaItem.description ?? undefined, // Nullish coalescing - converts null to undefined
        quantity: prismaItem.quantity,
        unitPrice: Money.create(Number(prismaItem.price), 'BRL'), // Prisma usa 'price'
      }),
    );

    // TODO: Quando o schema incluir campos de endereço, mapear aqui
    // Por enquanto, usar endereço padrão
    const address = Address.create({
      street: 'Rua Padrão',
      number: '0',
      neighborhood: 'Centro',
      city: 'Cidade',
      state: 'MG',
      zipCode: '00000000',
    });

    // Mapear status do enum do Prisma para Domain
    const statusMap: Record<PrismaOrderStatus, OrderStatusEnum> = {
      PENDING: OrderStatusEnum.PENDING,
      CONFIRMED: OrderStatusEnum.CONFIRMED,
      PREPARING: OrderStatusEnum.PREPARING,
      OUT_FOR_DELIVERY: OrderStatusEnum.OUT_FOR_DELIVERY,
      ARRIVING: OrderStatusEnum.ARRIVING,
      DELIVERED: OrderStatusEnum.DELIVERED,
      CANCELLED: OrderStatusEnum.CANCELLED,
    };

    // Mapear PaymentMethod do Prisma para Domain
    const paymentMethodMap: Record<PrismaPaymentMethod, PaymentMethodEnum> = {
      CREDIT_CARD: PaymentMethodEnum.CREDIT_CARD,
      DEBIT_CARD: PaymentMethodEnum.DEBIT_CARD,
      PIX: PaymentMethodEnum.PIX,
      CASH: PaymentMethodEnum.CASH,
    };

    const order = Order.reconstitute(prismaOrder.id, {
      customerId: prismaOrder.customerId,
      items,
      deliveryAddress: address,
      paymentMethod: PaymentMethod.create(
        paymentMethodMap[prismaOrder.paymentMethod],
      ),
      deliveryFee: Money.create(Number(prismaOrder.deliveryFee), 'BRL'),
      total: Money.create(Number(prismaOrder.total), 'BRL'),
      subtotal: Money.create(Number(prismaOrder.subtotal), 'BRL'),
      estimatedDeliveryTime: prismaOrder.estimatedDeliveryTime ?? undefined,
      status: OrderStatus.create(statusMap[prismaOrder.status]),
      createdAt: prismaOrder.createdAt,
      updatedAt: prismaOrder.updatedAt,
    });

    return order;
  }

  /**
   * Converte do modelo de Domínio (DDD) para o modelo Prisma (banco de dados)
   */
  static toPrisma(order: Order): {
    order: {
      customerId: number;
      status: PrismaOrderStatus;
      subtotal: number;
      deliveryFee: number;
      total: number;
      paymentMethod: PrismaPaymentMethod;
      estimatedDeliveryTime: number | null;
    };
    items: {
      productId: number;
      name: string; // Prisma usa 'name', não 'productName'
      description: string | null;
      quantity: number;
      price: number; // Prisma usa 'price', não 'unitPrice'
    }[];
  } {
    // Mapear status do domain para enum do Prisma
    const statusMap: Record<OrderStatusEnum, PrismaOrderStatus> = {
      [OrderStatusEnum.PENDING]: 'PENDING',
      [OrderStatusEnum.CONFIRMED]: 'CONFIRMED',
      [OrderStatusEnum.PREPARING]: 'PREPARING',
      [OrderStatusEnum.OUT_FOR_DELIVERY]: 'OUT_FOR_DELIVERY',
      [OrderStatusEnum.ARRIVING]: 'ARRIVING',
      [OrderStatusEnum.DELIVERED]: 'DELIVERED',
      [OrderStatusEnum.CANCELLED]: 'CANCELLED',
    };

    // Mapear PaymentMethod do Domain para Prisma
    const paymentMethodMap: Record<PaymentMethodEnum, PrismaPaymentMethod> = {
      [PaymentMethodEnum.CREDIT_CARD]: 'CREDIT_CARD',
      [PaymentMethodEnum.DEBIT_CARD]: 'DEBIT_CARD',
      [PaymentMethodEnum.PIX]: 'PIX',
      [PaymentMethodEnum.CASH]: 'CASH',
    };

    // Calcular subtotal (soma dos itens)
    const subtotal = order.items.reduce(
      (sum, item) => sum + item.unitPrice.amount * item.quantity,
      0,
    );

    // Calcular tempo estimado de entrega (30-60 minutos baseado na distância)
    // TODO: Integrar com serviço de roteamento para cálculo real
    const estimatedDeliveryTime =
      order.estimatedDeliveryTime ?? Math.floor(Math.random() * 30) + 30; // 30-60 minutos

    return {
      order: {
        customerId: order.customerId,
        status: statusMap[order.status.value],
        subtotal,
        deliveryFee: order.deliveryFee.amount,
        total: order.total.amount,
        paymentMethod: paymentMethodMap[order.paymentMethod.value],
        estimatedDeliveryTime,
      },
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.productName, // Domain usa 'productName', Prisma usa 'name'
        description: item.description || null,
        quantity: item.quantity,
        price: item.unitPrice.amount, // Domain usa 'unitPrice', Prisma usa 'price'
      })),
    };
  }
}
