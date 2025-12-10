import { Inject, Injectable } from '@nestjs/common';
import { DeliveryEntity } from '../../../domain/entities/delivery.entity';
import { 
  IDeliveryRepository, 
  DELIVERY_REPOSITORY 
} from '../../../domain/repositories/delivery.repository.interface';
import { EntityNotFoundException } from '../../../domain/exceptions/entity-not-found.exception';

@Injectable()
export class GetDeliveryByOrderIdUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: IDeliveryRepository,
  ) {}

  async execute(orderId: number): Promise<DeliveryEntity> {
    const delivery = await this.deliveryRepository.findByOrderId(orderId);
    
    if (!delivery) {
      throw new EntityNotFoundException('Entrega do pedido', orderId);
    }

    return delivery;
  }
}
