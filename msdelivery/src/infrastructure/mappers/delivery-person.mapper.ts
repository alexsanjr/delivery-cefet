import { DeliveryPersonEntity } from '../../domain/entities/delivery-person.entity';
import { DeliveryPersonStatus } from '../../domain/enums/delivery-person-status.enum';
import { VehicleType } from '../../domain/enums/vehicle-type.enum';
import { Email } from '../../domain/value-objects/email.vo';
import { Phone } from '../../domain/value-objects/phone.vo';
import { Cpf } from '../../domain/value-objects/cpf.vo';
import { Location } from '../../domain/value-objects/location.vo';
import { DeliveryPerson as PrismaDeliveryPerson } from '@prisma/client';

export class DeliveryPersonMapper {
  static toDomain(prismaDeliveryPerson: PrismaDeliveryPerson): DeliveryPersonEntity {
    return DeliveryPersonEntity.reconstitute({
      id: prismaDeliveryPerson.id,
      name: prismaDeliveryPerson.name,
      email: Email.create(prismaDeliveryPerson.email),
      phone: Phone.create(prismaDeliveryPerson.phone),
      cpf: Cpf.createWithoutValidation(prismaDeliveryPerson.cpf),
      vehicleType: prismaDeliveryPerson.vehicleType as VehicleType,
      licensePlate: prismaDeliveryPerson.licensePlate ?? undefined,
      status: prismaDeliveryPerson.status as DeliveryPersonStatus,
      rating: prismaDeliveryPerson.rating,
      totalDeliveries: prismaDeliveryPerson.totalDeliveries,
      currentLocation: prismaDeliveryPerson.currentLatitude && prismaDeliveryPerson.currentLongitude
        ? Location.create(prismaDeliveryPerson.currentLatitude, prismaDeliveryPerson.currentLongitude)
        : undefined,
      lastLocationUpdate: prismaDeliveryPerson.lastLocationUpdate ?? undefined,
      isActive: prismaDeliveryPerson.isActive,
      joinedAt: prismaDeliveryPerson.joinedAt,
      createdAt: prismaDeliveryPerson.createdAt,
      updatedAt: prismaDeliveryPerson.updatedAt,
    });
  }

  static toPersistence(entity: DeliveryPersonEntity): any {
    return {
      name: entity.name,
      email: entity.email.value,
      phone: entity.phone.value,
      cpf: entity.cpf.value,
      vehicleType: entity.vehicleType,
      licensePlate: entity.licensePlate ?? null,
      status: entity.status,
      rating: entity.rating,
      totalDeliveries: entity.totalDeliveries,
      currentLatitude: entity.currentLocation?.latitude ?? null,
      currentLongitude: entity.currentLocation?.longitude ?? null,
      lastLocationUpdate: entity.lastLocationUpdate ?? null,
      isActive: entity.isActive,
    };
  }
}
