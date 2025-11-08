import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderInput } from './dto/create-order.input';
import { UpdateOrderInput } from './dto/update-order.input';
import { IOrderDatasource } from './interfaces';
import { OrderStatus } from 'generated/prisma';

interface CreateOrderData extends CreateOrderInput {
  subtotal: number;
  deliveryFee: number;
  total: number;
  estimatedDeliveryTime: number;
  status: OrderStatus | string;
  customerId: number; // Torna obrigatório para criação
}

@Injectable()
export class OrdersDatasource implements IOrderDatasource {
  constructor(private readonly prisma: PrismaService) {}

  async create(orderData: CreateOrderData) {
    return this.prisma.order.create({
      data: {
        customerId: orderData.customerId,
        paymentMethod: orderData.paymentMethod,
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee,
        total: orderData.total,
        estimatedDeliveryTime: orderData.estimatedDeliveryTime,
        status: orderData.status as any,

        items: {
          create: await Promise.all(
            orderData.items.map(async (item) => {
              // Busca as informações completas do produto
              const product = await this.prisma.product.findUnique({
                where: { id: item.productId },
              });

              if (!product) {
                throw new Error(
                  `Produto com ID ${item.productId} não encontrado`,
                );
              }

              return {
                productId: item.productId,
                name: product.name,
                description: product.description,
                quantity: item.quantity,
                price: product.price,
              };
            }),
          ),
        },
      },
      include: {
        items: true,
      },
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findById(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
  }

  async findByCustomer(customerId: number) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByStatus(status: string) {
    return this.prisma.order.findMany({
      where: { status: status as any },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateStatus(orderData: UpdateOrderInput) {
    return this.prisma.order.update({
      where: { id: orderData.id },
      data: { status: orderData.status },
      include: {
        items: true,
      },
    });
  }

  async findProductById(productId: number) {
    return this.prisma.product.findUnique({
      where: { id: productId },
    });
  }

  // Métodos para gRPC Service
  async findOne(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
  }

  async findOrderItems(orderId: number) {
    return this.prisma.orderItem.findMany({
      where: { orderId },
      orderBy: {
        id: 'asc',
      },
    });
  }
}
