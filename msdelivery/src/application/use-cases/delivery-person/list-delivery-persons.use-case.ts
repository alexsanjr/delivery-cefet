import { Inject, Injectable } from '@nestjs/common';
import { DeliveryPersonEntity } from '../../../domain/entities/delivery-person.entity';
import { DeliveryPersonStatus } from '../../../domain/enums/delivery-person-status.enum';
import { 
  IDeliveryPersonRepository, 
  DELIVERY_PERSON_REPOSITORY 
} from '../../../domain/repositories/delivery-person.repository.interface';

@Injectable()
export class ListDeliveryPersonsUseCase {
  constructor(
    @Inject(DELIVERY_PERSON_REPOSITORY)
    private readonly deliveryPersonRepository: IDeliveryPersonRepository,
  ) {}

  async execute(status?: DeliveryPersonStatus, isActive?: boolean): Promise<DeliveryPersonEntity[]> {
    return this.deliveryPersonRepository.findAll(status, isActive);
  }
}
