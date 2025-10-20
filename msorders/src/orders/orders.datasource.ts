import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderInput } from './dto/create-order.input';

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

  // async findAll() {
  //   return this.prisma.order.findMany({
  //     include: {
  //       items: true,
  //     },
  //     orderBy: {
  //       createdAt: 'desc',
  //     },
  //   });
  // }

  async findById(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
  }

  // async findByCustomer(customerId: string) {
  //   return this.prisma.order.findMany({
  //     where: { customerId },
  //     include: {
  //       items: true,
  //     },
  //     orderBy: {
  //       createdAt: 'desc',
  //     },
  //   });
  // }

  // async updateStatus(orderId: string, status: string) {
  //   return this.prisma.order.update({
  //     where: { id: orderId },
  //     data: { status },
  //     include: {
  //       items: true,
  //     },
  //   });
  // }

  // async delete(id: string) {
  //   return this.prisma.order.delete({
  //     where: { id },
  //   });
  // }
}
