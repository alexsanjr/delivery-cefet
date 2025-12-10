import { Inject, Injectable } from '@nestjs/common';
import { DeliveryEntity } from '../../../domain/entities/delivery.entity';
import { 
  IDeliveryRepository, 
  DELIVERY_REPOSITORY 
} from '../../../domain/repositories/delivery.repository.interface';
import { BusinessRuleException } from '../../../domain/exceptions/business-rule.exception';
import { Location } from '../../../domain/value-objects/location.vo';
import { CreateDeliveryDto } from '../../dtos/delivery/create-delivery.dto';

@Injectable()
export class CreateDeliveryUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: IDeliveryRepository,
  ) {}

  async execute(dto: CreateDeliveryDto): Promise<DeliveryEntity> {
    // Verificar se já existe entrega para este pedido
    const existing = await this.deliveryRepository.findByOrderId(dto.orderId);
    if (existing) {
      throw new BusinessRuleException(`Já existe uma entrega para o pedido ${dto.orderId}`);
    }

    // Validar coordenadas
    const customerLocation = Location.create(dto.customerLatitude, dto.customerLongitude);

    // Criar entidade
    const delivery = DeliveryEntity.create({
      orderId: dto.orderId,
      customerLocation,
      customerAddress: dto.customerAddress,
    });

    return this.deliveryRepository.save(delivery);
  }
}
