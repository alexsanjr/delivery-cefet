import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { DeliveryPersonEntity } from '../../../../domain/entities/delivery-person.entity';
import { DeliveryPersonStatus } from '../../../../domain/enums/delivery-person-status.enum';
import { IDeliveryPersonRepository } from '../../../../domain/repositories/delivery-person.repository.interface';
import { DeliveryPersonMapper } from '../../../mappers/delivery-person.mapper';
import { Location } from '../../../../domain/value-objects/location.vo';

@Injectable()
export class PrismaDeliveryPersonRepository implements IDeliveryPersonRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<DeliveryPersonEntity | null> {
    const deliveryPerson = await this.prisma.deliveryPerson.findUnique({
      where: { id },
    });

    return deliveryPerson ? DeliveryPersonMapper.toDomain(deliveryPerson) : null;
  }

  async findByEmail(email: string): Promise<DeliveryPersonEntity | null> {
    const deliveryPerson = await this.prisma.deliveryPerson.findUnique({
      where: { email },
    });

    return deliveryPerson ? DeliveryPersonMapper.toDomain(deliveryPerson) : null;
  }

  async findByCpf(cpf: string): Promise<DeliveryPersonEntity | null> {
    const deliveryPerson = await this.prisma.deliveryPerson.findUnique({
      where: { cpf },
    });

    return deliveryPerson ? DeliveryPersonMapper.toDomain(deliveryPerson) : null;
  }

  async findByPhone(phone: string): Promise<DeliveryPersonEntity | null> {
    const deliveryPerson = await this.prisma.deliveryPerson.findUnique({
      where: { phone },
    });

    return deliveryPerson ? DeliveryPersonMapper.toDomain(deliveryPerson) : null;
  }

  async findByLicensePlate(licensePlate: string): Promise<DeliveryPersonEntity | null> {
    const deliveryPerson = await this.prisma.deliveryPerson.findFirst({
      where: { licensePlate },
    });

    return deliveryPerson ? DeliveryPersonMapper.toDomain(deliveryPerson) : null;
  }

  async findAll(status?: DeliveryPersonStatus, isActive?: boolean): Promise<DeliveryPersonEntity[]> {
    const deliveryPersons = await this.prisma.deliveryPerson.findMany({
      where: {
        ...(status && { status }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return deliveryPersons.map(DeliveryPersonMapper.toDomain);
  }

  async findAvailableNearby(latitude: number, longitude: number, radiusKm: number): Promise<DeliveryPersonEntity[]> {
    const availableDeliveryPersons = await this.prisma.deliveryPerson.findMany({
      where: {
        status: DeliveryPersonStatus.AVAILABLE,
        isActive: true,
        currentLatitude: { not: null },
        currentLongitude: { not: null },
      },
    });

    const centerLocation = Location.create(latitude, longitude);

    return availableDeliveryPersons
      .map(DeliveryPersonMapper.toDomain)
      .filter((dp) => {
        if (!dp.currentLocation) return false;
        const distance = dp.currentLocation.distanceTo(centerLocation);
        return distance <= radiusKm;
      });
  }

  async save(deliveryPerson: DeliveryPersonEntity): Promise<DeliveryPersonEntity> {
    const data = DeliveryPersonMapper.toPersistence(deliveryPerson);

    const created = await this.prisma.deliveryPerson.create({
      data,
    });

    return DeliveryPersonMapper.toDomain(created);
  }

  async update(deliveryPerson: DeliveryPersonEntity): Promise<DeliveryPersonEntity> {
    const data = DeliveryPersonMapper.toPersistence(deliveryPerson);

    const updated = await this.prisma.deliveryPerson.update({
      where: { id: deliveryPerson.id },
      data,
    });

    return DeliveryPersonMapper.toDomain(updated);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.deliveryPerson.delete({
      where: { id },
    });
  }
}
