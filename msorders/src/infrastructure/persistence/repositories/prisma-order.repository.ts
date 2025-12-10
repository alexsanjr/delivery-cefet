import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IOrderRepository } from '../../../domain/repositories/order.repository.interface';
import { Order } from '../../../domain/aggregates/order/order.aggregate';
import { OrderMapper } from '../mappers/order.mapper';

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(order: Order): Promise<Order> {
    const { order: orderData, items } = OrderMapper.toPrisma(order);

    const createdOrder = await this.prisma.order.create({
      data: {
        ...orderData,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });

    return OrderMapper.toDomain(createdOrder);
  }

  async findById(id: number): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    return order ? OrderMapper.toDomain(order) : null;
  }

  async findByCustomerId(customerId: number): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => OrderMapper.toDomain(order));
  }

  async findAll(): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => OrderMapper.toDomain(order));
  }

  async update(order: Order): Promise<Order> {
    const { order: orderData, items } = OrderMapper.toPrisma(order);

    // Delete existing items and create new ones (simpler than update)
    await this.prisma.orderItem.deleteMany({
      where: { orderId: order.id },
    });

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        ...orderData,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });

    return OrderMapper.toDomain(updatedOrder);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.orderItem.deleteMany({
      where: { orderId: id },
    });

    await this.prisma.order.delete({
      where: { id },
    });
  }
}
