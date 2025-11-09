import { Injectable } from '@nestjs/common';
import { Address } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IAddressRepository } from './interfaces/address-repository.interface';
import { CreateAddressInput } from '../dto/create-address.input';
import { UpdateAddressInput } from '../dto/update-address.input';

/**
 * Single Responsibility Principle (S):
 * Esta classe é responsável APENAS por operações de persistência de Address.
 * Separada do CustomerRepository para manter coesão.
 * 
 * Open/Closed Principle (O):
 * Pode ser estendida (ex: AddressWithGeolocationRepository) sem modificação.
 * 
 * Dependency Inversion Principle (D):
 * Implementa IAddressRepository, permitindo substituição.
 */
@Injectable()
export class AddressRepository implements IAddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async addToCustomer(customerId: number, data: CreateAddressInput): Promise<Address> {
    return await this.prisma.address.create({
      data: {
        ...data,
        customerId,
      },
    });
  }

  async update(addressId: number, data: UpdateAddressInput): Promise<Address> {
    return await this.prisma.address.update({
      where: { id: addressId },
      data: data,
    });
  }

  async findById(addressId: number): Promise<Address | null> {
    return await this.prisma.address.findUnique({
      where: { id: addressId },
    });
  }

  async removePrimaryFromCustomer(customerId: number): Promise<void> {
    await this.prisma.address.updateMany({
      where: { customerId },
      data: { isPrimary: false },
    });
  }

  async setPrimary(addressId: number): Promise<Address> {
    return await this.prisma.address.update({
      where: { id: addressId },
      data: { isPrimary: true },
    });
  }

  async remove(addressId: number): Promise<void> {
    await this.prisma.address.delete({
      where: { id: addressId },
    });
  }
}
