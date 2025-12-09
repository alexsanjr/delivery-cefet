import { Inject, Injectable } from '@nestjs/common';
import { DeliveryPersonEntity } from '../../../domain/entities/delivery-person.entity';
import { 
  IDeliveryPersonRepository, 
  DELIVERY_PERSON_REPOSITORY 
} from '../../../domain/repositories/delivery-person.repository.interface';
import { EntityNotFoundException } from '../../../domain/exceptions/entity-not-found.exception';
import { BusinessRuleException } from '../../../domain/exceptions/business-rule.exception';

@Injectable()
export class ToggleDeliveryPersonActiveUseCase {
  constructor(
    @Inject(DELIVERY_PERSON_REPOSITORY)
    private readonly deliveryPersonRepository: IDeliveryPersonRepository,
  ) {}

  async execute(id: number, isActive: boolean): Promise<DeliveryPersonEntity> {
    const deliveryPerson = await this.deliveryPersonRepository.findById(id);
    
    if (!deliveryPerson) {
      throw new EntityNotFoundException('Entregador', id);
    }

    try {
      if (isActive) {
        deliveryPerson.activate();
      } else {
        deliveryPerson.deactivate();
      }
    } catch (error) {
      throw new BusinessRuleException(error.message);
    }

    return this.deliveryPersonRepository.update(deliveryPerson);
  }
}
