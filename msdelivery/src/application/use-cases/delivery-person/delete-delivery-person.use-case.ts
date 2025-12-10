import { Inject, Injectable } from '@nestjs/common';
import { 
  IDeliveryPersonRepository, 
  DELIVERY_PERSON_REPOSITORY 
} from '../../../domain/repositories/delivery-person.repository.interface';
import { EntityNotFoundException } from '../../../domain/exceptions/entity-not-found.exception';

@Injectable()
export class DeleteDeliveryPersonUseCase {
  constructor(
    @Inject(DELIVERY_PERSON_REPOSITORY)
    private readonly deliveryPersonRepository: IDeliveryPersonRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const deliveryPerson = await this.deliveryPersonRepository.findById(id);
    
    if (!deliveryPerson) {
      throw new EntityNotFoundException('Entregador', id);
    }

    await this.deliveryPersonRepository.delete(id);
  }
}
