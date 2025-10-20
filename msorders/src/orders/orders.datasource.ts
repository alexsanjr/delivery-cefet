import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderInput } from './dto/create-order.input';
import { UpdateOrderInput } from './dto/update-order.input';

@Injectable()
export class OrdersDatasource {
  constructor(private readonly prisma: PrismaService) {}

  async create(orderData: CreateOrderInput) {
    return this.prisma.order.create({
      data: {
        customerId: 1,
        paymentMethod: orderData.paymentMethod,
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee,
        total: orderData.total,
        estimatedDeliveryTime: orderData.estimatedDeliveryTime,
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

  async updateStatus(orderData: UpdateOrderInput) {
    return this.prisma.order.update({
      where: { id: orderData.id },
      data: { status: orderData.status },
      include: {
        items: true,
      },
    });
  }

  // async delete(id: string) {
  //   return this.prisma.order.delete({
  //     where: { id },
  //   });
  // }
}
