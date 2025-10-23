import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryPersonInput } from './dto/create-delivery-person.input';
import { UpdateDeliveryPersonInput } from './dto/update-delivery-person.input';
import { UpdateStatusInput } from './dto/update-status.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { DeliveryPersonStatus } from './models/delivery-person-status.enum';

@Injectable()
export class DeliveryPersonsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDeliveryPersonInput: CreateDeliveryPersonInput) {
    const existingEmail = await this.prisma.deliveryPerson.findUnique({
      where: { email: createDeliveryPersonInput.email },
    });

    if (existingEmail) {
      throw new ConflictException("Email já cadastrado");
    }

    const existingCpf = await this.prisma.deliveryPerson.findUnique({
      where: { cpf: createDeliveryPersonInput.cpf },
    });

    if (existingCpf) {
      throw new ConflictException("CPF já cadastrado");
    }

    return this.prisma.deliveryPerson.create({
      data: {
        ...createDeliveryPersonInput,
        status: DeliveryPersonStatus.OFFLINE,
      },
    });
  }

  async findAll(status?: DeliveryPersonStatus, isActive?: boolean) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.deliveryPerson.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const deliveryPerson = await this.prisma.deliveryPerson.findUnique({
      where: { id },
    });

    if (!deliveryPerson) {
      throw new NotFoundException("Entregador não encontrado");
    }

    return deliveryPerson;
  }

  async update(id: string, updateDeliveryPersonInput: UpdateDeliveryPersonInput) {
    await this.findOne(id);

    if (updateDeliveryPersonInput.email) {
      const existingEmail = await this.prisma.deliveryPerson.findFirst({
        where: {
          email: updateDeliveryPersonInput.email,
          NOT: { id },
        },
      });

      if (existingEmail) {
        throw new ConflictException("Email já cadastrado");
      }
    }

    return this.prisma.deliveryPerson.update({
      where: { id },
      data: updateDeliveryPersonInput,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.deliveryPerson.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async updateStatus(updateStatusInput: UpdateStatusInput) {
    const { deliveryPersonId, status } = updateStatusInput;

    await this.findOne(deliveryPersonId);

    return this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: { status },
    });
  }

  async updateLocation(updateLocationInput: UpdateLocationInput) {
    const { deliveryPersonId, latitude, longitude, accuracy, speed, heading } = updateLocationInput;

    await this.findOne(deliveryPersonId);

    const deliveryPerson = await this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationUpdate: new Date(),
      },
    });

    return deliveryPerson;
  }

  async findAvailableNearby(latitude: number, longitude: number, radiusKm: number) {
    const deliveryPersons = await this.prisma.deliveryPerson.findMany({
      where: {
        status: DeliveryPersonStatus.AVAILABLE,
        isActive: true,
        currentLatitude: { not: null },
        currentLongitude: { not: null },
      },
    });

    return deliveryPersons.filter((dp) => {
      if (!dp.currentLatitude || !dp.currentLongitude) return false;

      const distance = this.calculateDistance(
        latitude,
        longitude,
        dp.currentLatitude,
        dp.currentLongitude,
      );

      return distance <= radiusKm;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
