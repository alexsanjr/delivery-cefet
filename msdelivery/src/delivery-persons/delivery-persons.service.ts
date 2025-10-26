import { Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryPerson } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryPersonValidationService } from './services/delivery-person-validation.service';
import { calculateDistance } from './utils/distance.helper';
import { CreateDeliveryPersonInput } from './dto/create-delivery-person.input';
import { UpdateDeliveryPersonInput } from './dto/update-delivery-person.input';
import { UpdateStatusInput } from './dto/update-status.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { DeliveryPersonStatus } from './models/delivery-person-status.enum';

@Injectable()
export class DeliveryPersonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: DeliveryPersonValidationService,
  ) {}

  async create(createDeliveryPersonInput: CreateDeliveryPersonInput): Promise<DeliveryPerson> {
    await this.validationService.validateEmailUniqueness(createDeliveryPersonInput.email);
    await this.validationService.validateCpfUniqueness(createDeliveryPersonInput.cpf);

    return this.prisma.deliveryPerson.create({
      data: createDeliveryPersonInput,
    });
  }

  async findAll(status?: DeliveryPersonStatus, isActive?: boolean): Promise<DeliveryPerson[]> {
    return this.prisma.deliveryPerson.findMany({
      where: {
        ...(status && { status }),
        ...(isActive !== undefined && { isActive }),
      },
    });
  }

  async findOne(id: string): Promise<DeliveryPerson> {
    const deliveryPerson = await this.prisma.deliveryPerson.findUnique({
      where: { id },
    });

    if (!deliveryPerson) {
      throw new NotFoundException('Entregador não encontrado');
    }

    return deliveryPerson;
  }

  async update(id: string, updateDeliveryPersonInput: UpdateDeliveryPersonInput): Promise<DeliveryPerson> {
    await this.findOne(id);

    if (updateDeliveryPersonInput.email) {
      await this.validationService.validateEmailUniqueness(updateDeliveryPersonInput.email, id);
    }

    return this.prisma.deliveryPerson.update({
      where: { id },
      data: updateDeliveryPersonInput,
    });
  }

  async remove(id: string): Promise<DeliveryPerson> {
    await this.findOne(id);
    
    return this.prisma.deliveryPerson.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async updateStatus(updateStatusInput: UpdateStatusInput): Promise<DeliveryPerson> {
    const { deliveryPersonId, status } = updateStatusInput;
    await this.findOne(deliveryPersonId);

    return this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: { status },
    });
  }

  async updateLocation(updateLocationInput: UpdateLocationInput): Promise<DeliveryPerson> {
    const { deliveryPersonId, latitude, longitude } = updateLocationInput;
    await this.findOne(deliveryPersonId);

    return this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationUpdate: new Date(),
      },
    });
  }

  async findAvailableNearby(latitude: number, longitude: number, radiusKm: number): Promise<DeliveryPerson[]> {
    const availableDeliveryPersons = await this.prisma.deliveryPerson.findMany({
      where: {
        status: DeliveryPersonStatus.AVAILABLE,
        isActive: true,
      },
    });

    return availableDeliveryPersons.filter(person => {
      if (!person.currentLatitude || !person.currentLongitude) {
        return false;
      }

      const distance = calculateDistance(
        latitude,
        longitude,
        person.currentLatitude,
        person.currentLongitude,
      );

      return distance <= radiusKm;
    });
  }
}
