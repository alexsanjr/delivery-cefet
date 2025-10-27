import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller()
export class GrpcCustomersService {
  constructor(private prisma: PrismaService) {}

  @GrpcMethod('CustomersService', 'GetCustomer')
  async getCustomer(data: { id: number }) {
    console.log('[gRPC] GetCustomer called with id:', data.id);
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: data.id },
        include: { addresses: true },
      });

      if (!customer) {
        return { error: 'Cliente não encontrado' };
      }

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        isPremium: customer.isPremium,
        addresses: customer.addresses.map((addr) => ({
          id: addr.id,
          street: addr.street,
          number: addr.number,
          neighborhood: addr.neighborhood,
          city: addr.city,
          state: addr.state,
          zipCode: addr.zipCode,
          complement: addr.complement,
          isPrimary: addr.isPrimary,
          customerId: addr.customerId,
          createdAt: addr.createdAt.toISOString(),
        })),
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      };
    } catch {
      return { error: 'Erro ao buscar cliente' };
    }
  }

  @GrpcMethod('CustomersService', 'ValidateCustomer')
  async validateCustomer(data: { id: number }) {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: data.id },
      });

      if (!customer) {
        return {
          isValid: false,
          message: 'Cliente não encontrado',
          customer: null,
        };
      }

      return {
        isValid: true,
        message: 'Cliente válido',
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          isPremium: customer.isPremium,
          addresses: [], // Ou buscar endereços se quiser
          createdAt: customer.createdAt.toISOString(),
          updatedAt: customer.updatedAt.toISOString(),
        },
      };
    } catch {
      return {
        isValid: false,
        message: 'Erro ao validar cliente',
        customer: null,
      };
    }
  }
}
