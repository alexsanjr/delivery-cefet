import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeliveryPersonValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validateEmailUniqueness(email: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.deliveryPerson.findUnique({
      where: { email },
    });
    
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Email já cadastrado');
    }
  }

  async validateCpfUniqueness(cpf: string): Promise<void> {
    const existing = await this.prisma.deliveryPerson.findUnique({
      where: { cpf },
    });
    
    if (existing) {
      throw new ConflictException('CPF já cadastrado');
    }
  }
}
