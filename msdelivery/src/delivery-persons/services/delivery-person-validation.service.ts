import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeliveryPersonValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validateEmailUniqueness(email: string, excludeId?: number): Promise<void> {
    const existing = await this.prisma.deliveryPerson.findUnique({
      where: { email },
    });
    
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Email já cadastrado');
    }
  }

  async validateCpfUniqueness(cpf: string, excludeId?: number): Promise<void> {
    const existing = await this.prisma.deliveryPerson.findUnique({
      where: { cpf },
    });
    
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('CPF já cadastrado');
    }
  }

  async validatePhoneUniqueness(phone: string, excludeId?: number): Promise<void> {
    const existing = await this.prisma.deliveryPerson.findFirst({
      where: { 
        phone,
        isActive: true,
      },
    });
    
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Telefone já cadastrado');
    }
  }

  async validateLicensePlateUniqueness(licensePlate: string, excludeId?: number): Promise<void> {
    if (!licensePlate || licensePlate.trim() === '') {
      return; // Placa vazia ou null é permitida
    }

    const existing = await this.prisma.deliveryPerson.findFirst({
      where: { 
        licensePlate,
        isActive: true,
      },
    });
    
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Placa já cadastrada para outro entregador');
    }
  }
}
