import { DeliveryEntity } from '../../domain/entities/delivery.entity';
import { DeliveryStatus } from '../../domain/enums/delivery-status.enum';
import { Location } from '../../domain/value-objects/location.vo';
import { Delivery as PrismaDelivery, DeliveryPerson as PrismaDeliveryPerson } from '@prisma/client';
import { DeliveryPersonMapper } from './delivery-person.mapper';

type PrismaDeliveryWithRelations = PrismaDelivery & {
  deliveryPerson?: PrismaDeliveryPerson | null;
};

export class DeliveryMapper {
  static toDomain(prismaDelivery: PrismaDeliveryWithRelations): DeliveryEntity {
    return DeliveryEntity.reconstitute({
      id: prismaDelivery.id,
      orderId: prismaDelivery.orderId,
      deliveryPersonId: prismaDelivery.deliveryPersonId ?? undefined,
      deliveryPerson: prismaDelivery.deliveryPerson 
        ? DeliveryPersonMapper.toDomain(prismaDelivery.deliveryPerson)
        : undefined,
      status: prismaDelivery.status as DeliveryStatus,
      customerLocation: Location.create(prismaDelivery.customerLatitude, prismaDelivery.customerLongitude),
      customerAddress: prismaDelivery.customerAddress,
      assignedAt: prismaDelivery.assignedAt ?? undefined,
      pickedUpAt: prismaDelivery.pickedUpAt ?? undefined,
      deliveredAt: prismaDelivery.deliveredAt ?? undefined,
      cancelledAt: prismaDelivery.cancelledAt ?? undefined,
      estimatedDeliveryTime: prismaDelivery.estimatedDeliveryTime ?? undefined,
      actualDeliveryTime: prismaDelivery.actualDeliveryTime ?? undefined,
      createdAt: prismaDelivery.createdAt,
      updatedAt: prismaDelivery.updatedAt,
    });
  }

  static toPersistence(entity: DeliveryEntity): any {
    return {
      orderId: entity.orderId,
      deliveryPersonId: entity.deliveryPersonId ?? null,
      status: entity.status,
      customerLatitude: entity.customerLocation.latitude,
      customerLongitude: entity.customerLocation.longitude,
      customerAddress: entity.customerAddress,
      assignedAt: entity.assignedAt ?? null,
      pickedUpAt: entity.pickedUpAt ?? null,
      deliveredAt: entity.deliveredAt ?? null,
      cancelledAt: entity.cancelledAt ?? null,
      estimatedDeliveryTime: entity.estimatedDeliveryTime ?? null,
      actualDeliveryTime: entity.actualDeliveryTime ?? null,
    };
  }
}
