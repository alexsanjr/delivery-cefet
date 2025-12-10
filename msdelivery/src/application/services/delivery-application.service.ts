import { Injectable, Logger } from '@nestjs/common';
import { CreateDeliveryUseCase } from '../use-cases/delivery/create-delivery.use-case';
import { AssignDeliveryUseCase } from '../use-cases/delivery/assign-delivery.use-case';
import { UpdateDeliveryStatusUseCase } from '../use-cases/delivery/update-delivery-status.use-case';
import { DeliveryEventPublisher } from '../../infrastructure/messaging/publishers/delivery-event.publisher';
import { CreateDeliveryDto } from '../dtos/delivery/create-delivery.dto';
import { AssignDeliveryDto } from '../dtos/delivery/assign-delivery.dto';
import { UpdateDeliveryStatusDto } from '../dtos/delivery/update-delivery-status.dto';
import { DeliveryEntity } from '../../domain/entities/delivery.entity';
import { DeliveryStatus } from '../../domain/enums/delivery-status.enum';

@Injectable()
export class DeliveryApplicationService {
  private readonly logger = new Logger(DeliveryApplicationService.name);

  constructor(
    private readonly createDeliveryUseCase: CreateDeliveryUseCase,
    private readonly assignDeliveryUseCase: AssignDeliveryUseCase,
    private readonly updateStatusUseCase: UpdateDeliveryStatusUseCase,
    private readonly eventPublisher: DeliveryEventPublisher,
  ) {}

  async create(dto: CreateDeliveryDto): Promise<DeliveryEntity> {
    const delivery = await this.createDeliveryUseCase.execute(dto);

    // Publicar evento de criação
    try {
      await this.eventPublisher.publishDeliveryCreated({
        deliveryId: delivery.id!,
        orderId: delivery.orderId,
        customerLatitude: delivery.customerLocation.latitude,
        customerLongitude: delivery.customerLocation.longitude,
        customerAddress: delivery.customerAddress,
        status: delivery.status,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to publish DeliveryCreated event: ${error}`);
    }

    return delivery;
  }

  async assign(dto: AssignDeliveryDto): Promise<DeliveryEntity> {
    const delivery = await this.assignDeliveryUseCase.execute(dto);

    // Publicar evento de atribuição
    try {
      await this.eventPublisher.publishDeliveryAssigned({
        deliveryId: delivery.id!,
        orderId: delivery.orderId,
        deliveryPersonId: delivery.deliveryPersonId!,
        deliveryPersonName: delivery.deliveryPerson?.name || '',
        deliveryPersonPhone: delivery.deliveryPerson?.phone.value || '',
        vehicleType: delivery.deliveryPerson?.vehicleType || '',
        estimatedDeliveryTime: delivery.estimatedDeliveryTime || 0,
        assignedAt: delivery.assignedAt?.toISOString() || new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to publish DeliveryAssigned event: ${error}`);
    }

    return delivery;
  }

  async updateStatus(dto: UpdateDeliveryStatusDto, previousStatus: string): Promise<DeliveryEntity> {
    const delivery = await this.updateStatusUseCase.execute(dto);

    // Publicar evento de atualização de status
    try {
      await this.eventPublisher.publishDeliveryStatusUpdated({
        deliveryId: delivery.id!,
        orderId: delivery.orderId,
        previousStatus,
        newStatus: delivery.status,
        updatedAt: new Date().toISOString(),
        deliveryPersonId: delivery.deliveryPersonId,
      });

      // Se foi completada, publicar evento específico
      if (delivery.status === DeliveryStatus.DELIVERED) {
        const actualDeliveryTime = delivery.deliveredAt && delivery.assignedAt
          ? Math.floor((delivery.deliveredAt.getTime() - delivery.assignedAt.getTime()) / 60000)
          : 0;

        await this.eventPublisher.publishDeliveryCompleted({
          deliveryId: delivery.id!,
          orderId: delivery.orderId,
          deliveryPersonId: delivery.deliveryPersonId!,
          deliveredAt: delivery.deliveredAt?.toISOString() || new Date().toISOString(),
          actualDeliveryTime,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to publish DeliveryStatusUpdated event: ${error}`);
    }

    return delivery;
  }
}
