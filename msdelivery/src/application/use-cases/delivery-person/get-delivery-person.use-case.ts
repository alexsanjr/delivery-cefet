import { Inject, Injectable } from '@nestjs/common';
import { DeliveryPersonEntity } from '../../../domain/entities/delivery-person.entity';
import { 
  IDeliveryPersonRepository, 
  DELIVERY_PERSON_REPOSITORY 
} from '../../../domain/repositories/delivery-person.repository.interface';
import { EntityNotFoundException } from '../../../domain/exceptions/entity-not-found.exception';

@Injectable()
export class GetDeliveryPersonUseCase {
  constructor(
    @Inject(DELIVERY_PERSON_REPOSITORY)
    private readonly deliveryPersonRepository: IDeliveryPersonRepository,
  ) {}

  async execute(id: number): Promise<DeliveryPersonEntity> {
    const deliveryPerson = await this.deliveryPersonRepository.findById(id);
    
    if (!deliveryPerson) {
      throw new EntityNotFoundException('Entregador', id);
    }

    return deliveryPerson;
  }
}
