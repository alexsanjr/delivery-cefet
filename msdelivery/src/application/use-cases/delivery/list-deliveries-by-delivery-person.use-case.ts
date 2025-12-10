import { Inject, Injectable } from '@nestjs/common';
import { DeliveryEntity } from '../../../domain/entities/delivery.entity';
import { 
  IDeliveryRepository, 
  DELIVERY_REPOSITORY 
} from '../../../domain/repositories/delivery.repository.interface';

@Injectable()
export class ListDeliveriesByDeliveryPersonUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: IDeliveryRepository,
  ) {}

  async execute(deliveryPersonId: number): Promise<DeliveryEntity[]> {
    return this.deliveryRepository.findByDeliveryPersonId(deliveryPersonId);
  }
}
