import { Inject, Injectable } from '@nestjs/common';
import { DeliveryEntity } from '../../../domain/entities/delivery.entity';
import { DeliveryStatus } from '../../../domain/enums/delivery-status.enum';
import { 
  IDeliveryRepository, 
  DELIVERY_REPOSITORY 
} from '../../../domain/repositories/delivery.repository.interface';

@Injectable()
export class ListDeliveriesByStatusUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: IDeliveryRepository,
  ) {}

  async execute(statuses: DeliveryStatus[]): Promise<DeliveryEntity[]> {
    const statusList = statuses.length > 0 
      ? statuses 
      : [DeliveryStatus.PENDING, DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT];

    return this.deliveryRepository.findByStatuses(statusList);
  }
}
