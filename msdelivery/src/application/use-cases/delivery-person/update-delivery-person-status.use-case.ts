import { Inject, Injectable } from '@nestjs/common';
import { DeliveryPersonEntity } from '../../../domain/entities/delivery-person.entity';
import { DeliveryPersonStatus } from '../../../domain/enums/delivery-person-status.enum';
import { 
  IDeliveryPersonRepository, 
  DELIVERY_PERSON_REPOSITORY 
} from '../../../domain/repositories/delivery-person.repository.interface';
import { EntityNotFoundException } from '../../../domain/exceptions/entity-not-found.exception';
import { BusinessRuleException } from '../../../domain/exceptions/business-rule.exception';
import { UpdateDeliveryPersonStatusDto } from '../../dtos/delivery-person/update-status.dto';

@Injectable()
export class UpdateDeliveryPersonStatusUseCase {
  constructor(
    @Inject(DELIVERY_PERSON_REPOSITORY)
    private readonly deliveryPersonRepository: IDeliveryPersonRepository,
  ) {}

  async execute(dto: UpdateDeliveryPersonStatusDto): Promise<DeliveryPersonEntity> {
    const deliveryPerson = await this.deliveryPersonRepository.findById(dto.deliveryPersonId);
    
    if (!deliveryPerson) {
      throw new EntityNotFoundException('Entregador', dto.deliveryPersonId);
    }

    // Validar se status é válido
    const validStatuses = Object.values(DeliveryPersonStatus);
    if (!validStatuses.includes(dto.status)) {
      throw new BusinessRuleException(
        `Status inválido: "${dto.status}". Status válidos: ${validStatuses.join(', ')}`,
      );
    }

    // Usar método de domínio para mudar status
    try {
      deliveryPerson.changeStatus(dto.status);
    } catch (error) {
      throw new BusinessRuleException(error.message);
    }

    return this.deliveryPersonRepository.update(deliveryPerson);
  }
}
