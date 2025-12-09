import { Inject, Injectable } from '@nestjs/common';
import { DeliveryEntity } from '../../../domain/entities/delivery.entity';
import { DeliveryStatus } from '../../../domain/enums/delivery-status.enum';
import { DeliveryPersonStatus } from '../../../domain/enums/delivery-person-status.enum';
import { 
  IDeliveryRepository, 
  DELIVERY_REPOSITORY 
} from '../../../domain/repositories/delivery.repository.interface';
import { 
  IDeliveryPersonRepository, 
  DELIVERY_PERSON_REPOSITORY 
} from '../../../domain/repositories/delivery-person.repository.interface';
import { EntityNotFoundException } from '../../../domain/exceptions/entity-not-found.exception';
import { BusinessRuleException } from '../../../domain/exceptions/business-rule.exception';
import { UpdateDeliveryStatusDto } from '../../dtos/delivery/update-delivery-status.dto';

@Injectable()
export class UpdateDeliveryStatusUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: IDeliveryRepository,
    @Inject(DELIVERY_PERSON_REPOSITORY)
    private readonly deliveryPersonRepository: IDeliveryPersonRepository,
  ) {}

  async execute(dto: UpdateDeliveryStatusDto): Promise<DeliveryEntity> {
    const delivery = await this.deliveryRepository.findById(dto.deliveryId);

    if (!delivery) {
      throw new EntityNotFoundException('Entrega', dto.deliveryId);
    }

    // Validar se status é válido
    const validStatuses = Object.values(DeliveryStatus);
    if (!validStatuses.includes(dto.status)) {
      throw new BusinessRuleException(
        `Status inválido: "${dto.status}". Status válidos: ${validStatuses.join(', ')}`,
      );
    }

    // Usar método de domínio para mudar status
    try {
      delivery.changeStatus(dto.status);
    } catch (error) {
      throw new BusinessRuleException(error.message);
    }

    const updatedDelivery = await this.deliveryRepository.update(delivery);

    // Se entrega foi finalizada, liberar entregador
    if (delivery.isInFinalStatus() && delivery.deliveryPersonId) {
      const deliveryPerson = await this.deliveryPersonRepository.findById(delivery.deliveryPersonId);
      
      if (deliveryPerson) {
        deliveryPerson.changeStatus(DeliveryPersonStatus.AVAILABLE);
        
        // Incrementar entregas se foi entregue com sucesso
        if (dto.status === DeliveryStatus.DELIVERED) {
          deliveryPerson.incrementDeliveries();
        }
        
        await this.deliveryPersonRepository.update(deliveryPerson);
      }
    }

    return updatedDelivery;
  }
}
