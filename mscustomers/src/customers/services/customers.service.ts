import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerInput } from '../dto/create-customer.input';
import { UpdateCustomerInput } from '../dto/update-customer.input';
import { CreateAddressInput } from '../dto/create-address.input';
import { UpdateAddressInput } from '../dto/update-address.input';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCustomerInput: CreateCustomerInput) {
    // Verificar se email já existe
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { email: createCustomerInput.email },
    });

    if (existingCustomer) {
      throw new ConflictException('Cliente com email ja existente.');
    }

    return await this.prisma.customer.create({
      data: {
        name: createCustomerInput.name,
        email: createCustomerInput.email,
        phone: createCustomerInput.phone,
        addresses: createCustomerInput.address ? {
          create: {
            ...createCustomerInput.address,
            isPrimary: true, // Primeiro endereço é sempre primário
          },
        } : undefined,
        isPremium: createCustomerInput.isPremium
      },
      include: {
        addresses: true,
      },
    });
  }

  async findAll() {
    return await this.prisma.customer.findMany({
      include: {
        addresses: {
          orderBy: { isPrimary: 'desc' },
        },
      },
    });
  }

  async findById(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: {
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Cliente ${id} nao encontrado.`);
    }

    return customer;
  }

  async findByEmail(email: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { email },
      include: {
        addresses: {
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Cliente com email ${email} nao encontrado.`);
    }

    return customer;
  }

  async update(id: number, updateCustomerInput: UpdateCustomerInput) {
    await this.findById(id); // Verifica se existe

    return await this.prisma.customer.update({
      where: { id },
      data: updateCustomerInput,
      include: {
        addresses: {
          orderBy: { isPrimary: 'desc' },
        },
      },
    });
  }

  async addAddress(customerId: number, createAddressInput: CreateAddressInput) {
    await this.findById(customerId); // Verifica se customer existe

    return await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        addresses: {
          create: createAddressInput,
        },
      },
      include: {
        addresses: {
          orderBy: { isPrimary: 'desc' },
        },
      },
    });
  }

  async updateAddress(addressId: number, updateAddressInput: UpdateAddressInput) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException(`Endereco ${addressId} nao encontrado.`);
    }

    return await this.prisma.address.update({
      where: { id: addressId },
      data: updateAddressInput,
    });
  }

  async setPrimaryAddress(customerId: number, addressId: number) {
    // Primeiro, remove primary de todos os endereços do customer
    await this.prisma.address.updateMany({
      where: { customerId },
      data: { isPrimary: false },
    });

    // Depois, seta o endereço específico como primary
    await this.prisma.address.update({
      where: { id: addressId },
      data: { isPrimary: true },
    });

    return await this.findById(customerId);
  }

  async removeAddress(addressId: number) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException(`Endereco ${addressId} nao encontrado.`);
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return true;
  }
}