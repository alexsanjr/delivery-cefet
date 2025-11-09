import { Injectable } from '@nestjs/common';
import { Customer, Address } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ICustomerRepository } from './interfaces/customer-repository.interface';
import { CreateCustomerInput } from '../dto/create-customer.input';
import { UpdateCustomerInput } from '../dto/update-customer.input';

/**
 * Single Responsibility Principle (S):
 * Esta classe é responsável APENAS por operações de persistência de Customer.
 * Não contém lógica de negócio, validações ou regras.
 * 
 * Open/Closed Principle (O):
 * Aberto para extensão: pode-se criar novos repositórios (ex: CustomerCacheRepository)
 * Fechado para modificação: implementa interface, mudanças não afetam o contrato.
 * 
 * Dependency Inversion Principle (D):
 * Implementa ICustomerRepository, permitindo que o serviço dependa da abstração.
 */
@Injectable()
export class CustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<(Customer & { addresses: Address[] })[]> {
    return await this.prisma.customer.findMany({
      include: {
        addresses: {
          orderBy: { isPrimary: 'desc' },
        },
      },
    });
  }

  async findById(id: number): Promise<(Customer & { addresses: Address[] }) | null> {
    return await this.prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: {
          orderBy: { isPrimary: 'desc' },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<(Customer & { addresses: Address[] }) | null> {
    return await this.prisma.customer.findUnique({
      where: { email },
      include: {
        addresses: {
          orderBy: { isPrimary: 'desc' },
        },
      },
    });
  }

  async create(data: CreateCustomerInput): Promise<Customer & { addresses: Address[] }> {
    return await this.prisma.customer.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        isPremium: data.isPremium,
        addresses: data.address
          ? {
              create: {
                ...data.address,
                isPrimary: true,
              },
            }
          : undefined,
      },
      include: {
        addresses: true,
      },
    });
  }

  async update(
    id: number,
    data: UpdateCustomerInput,
  ): Promise<Customer & { addresses: Address[] }> {
    return await this.prisma.customer.update({
      where: { id },
      data: data,
      include: {
        addresses: {
          orderBy: { isPrimary: 'desc' },
        },
      },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.customer.count({
      where: { email },
    });
    return count > 0;
  }
}
