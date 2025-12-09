import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { DeliveryEntity } from '../../../../domain/entities/delivery.entity';
import { DeliveryStatus } from '../../../../domain/enums/delivery-status.enum';
import { IDeliveryRepository } from '../../../../domain/repositories/delivery.repository.interface';
import { DeliveryMapper } from '../../../mappers/delivery.mapper';

@Injectable()
export class PrismaDeliveryRepository implements IDeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<DeliveryEntity | null> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: { deliveryPerson: true },
    });

    return delivery ? DeliveryMapper.toDomain(delivery) : null;
  }

  async findByOrderId(orderId: number): Promise<DeliveryEntity | null> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { orderId },
      include: { deliveryPerson: true },
    });

    return delivery ? DeliveryMapper.toDomain(delivery) : null;
  }

  async findByStatuses(statuses: DeliveryStatus[]): Promise<DeliveryEntity[]> {
    const deliveries = await this.prisma.delivery.findMany({
      where: { status: { in: statuses } },
      include: { deliveryPerson: true },
      orderBy: { createdAt: 'desc' },
    });

    return deliveries.map(DeliveryMapper.toDomain);
  }

  async findByDeliveryPersonId(deliveryPersonId: number): Promise<DeliveryEntity[]> {
    const deliveries = await this.prisma.delivery.findMany({
      where: { deliveryPersonId },
      include: { deliveryPerson: true },
      orderBy: { createdAt: 'desc' },
    });

    return deliveries.map(DeliveryMapper.toDomain);
  }

  async save(delivery: DeliveryEntity): Promise<DeliveryEntity> {
    const data = DeliveryMapper.toPersistence(delivery);

    const created = await this.prisma.delivery.create({
      data,
      include: { deliveryPerson: true },
    });

    return DeliveryMapper.toDomain(created);
  }

  async update(delivery: DeliveryEntity): Promise<DeliveryEntity> {
    const data = DeliveryMapper.toPersistence(delivery);

    const updated = await this.prisma.delivery.update({
      where: { id: delivery.id },
      data,
      include: { deliveryPerson: true },
    });

    return DeliveryMapper.toDomain(updated);
  }
}
