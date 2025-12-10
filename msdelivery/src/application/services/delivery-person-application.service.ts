import { Injectable, Logger } from '@nestjs/common';
import { CreateDeliveryPersonUseCase } from '../use-cases/delivery-person/create-delivery-person.use-case';
import { UpdateDeliveryPersonStatusUseCase } from '../use-cases/delivery-person/update-delivery-person-status.use-case';
import { UpdateDeliveryPersonLocationUseCase } from '../use-cases/delivery-person/update-delivery-person-location.use-case';
import { DeliveryPersonEventPublisher } from '../../infrastructure/messaging/publishers/delivery-person-event.publisher';
import { CreateDeliveryPersonDto } from '../dtos/delivery-person/create-delivery-person.dto';
import { UpdateDeliveryPersonStatusDto } from '../dtos/delivery-person/update-status.dto';
import { UpdateDeliveryPersonLocationDto } from '../dtos/delivery-person/update-location.dto';
import { DeliveryPersonEntity } from '../../domain/entities/delivery-person.entity';

@Injectable()
export class DeliveryPersonApplicationService {
  private readonly logger = new Logger(DeliveryPersonApplicationService.name);

  constructor(
    private readonly createDeliveryPersonUseCase: CreateDeliveryPersonUseCase,
    private readonly updateStatusUseCase: UpdateDeliveryPersonStatusUseCase,
    private readonly updateLocationUseCase: UpdateDeliveryPersonLocationUseCase,
    private readonly eventPublisher: DeliveryPersonEventPublisher,
  ) {}

  async create(dto: CreateDeliveryPersonDto): Promise<DeliveryPersonEntity> {
    const deliveryPerson = await this.createDeliveryPersonUseCase.execute(dto);

    // Publicar evento de criação
    try {
      await this.eventPublisher.publishDeliveryPersonCreated({
        deliveryPersonId: deliveryPerson.id!,
        name: deliveryPerson.name,
        cpf: deliveryPerson.cpf.value,
        email: deliveryPerson.email.value,
        phone: deliveryPerson.phone.value,
        vehicleType: deliveryPerson.vehicleType,
        status: deliveryPerson.status,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to publish DeliveryPersonCreated event: ${error}`);
      // Não falha a operação se o evento não for publicado
    }

    return deliveryPerson;
  }

  async updateStatus(id: number, dto: UpdateDeliveryPersonStatusDto, previousStatus: string): Promise<DeliveryPersonEntity> {
    const deliveryPerson = await this.updateStatusUseCase.execute(dto);

    // Publicar evento de atualização de status
    try {
      await this.eventPublisher.publishDeliveryPersonStatusUpdated({
        deliveryPersonId: deliveryPerson.id!,
        previousStatus,
        newStatus: deliveryPerson.status,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to publish DeliveryPersonStatusUpdated event: ${error}`);
    }

    return deliveryPerson;
  }

  async updateLocation(dto: UpdateDeliveryPersonLocationDto): Promise<DeliveryPersonEntity> {
    const deliveryPerson = await this.updateLocationUseCase.execute(dto);

    // Publicar evento de atualização de localização
    try {
      await this.eventPublisher.publishDeliveryPersonLocationUpdated({
        deliveryPersonId: deliveryPerson.id!,
        latitude: deliveryPerson.currentLocation!.latitude,
        longitude: deliveryPerson.currentLocation!.longitude,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to publish DeliveryPersonLocationUpdated event: ${error}`);
    }

    return deliveryPerson;
  }
}
