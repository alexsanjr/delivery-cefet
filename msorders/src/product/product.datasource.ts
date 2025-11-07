import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';

@Injectable()
export class ProductDatasource {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findById(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: true,
      },
    });
  }

  async create(productData: CreateProductInput) {
    return this.prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category,
      },
    });
  }

  async updateStatus(productData: UpdateProductInput) {
    return this.prisma.product.update({
      where: { id: productData.id },
      data: {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category,
      },
    });
  }

  async delete(id: number) {
    return await this.prisma.product.delete({
      where: { id },
    });
  }
}
