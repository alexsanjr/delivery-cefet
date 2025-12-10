import { Inject, Injectable } from '@nestjs/common';
import { DeliveryPersonEntity } from '../../../domain/entities/delivery-person.entity';
import { 
  IDeliveryPersonRepository, 
  DELIVERY_PERSON_REPOSITORY 
} from '../../../domain/repositories/delivery-person.repository.interface';
import { EntityNotFoundException } from '../../../domain/exceptions/entity-not-found.exception';
import { BusinessRuleException } from '../../../domain/exceptions/business-rule.exception';
import { Location } from '../../../domain/value-objects/location.vo';
import { UpdateDeliveryPersonLocationDto } from '../../dtos/delivery-person/update-location.dto';

@Injectable()
export class UpdateDeliveryPersonLocationUseCase {
  constructor(
    @Inject(DELIVERY_PERSON_REPOSITORY)
    private readonly deliveryPersonRepository: IDeliveryPersonRepository,
  ) {}

  async execute(dto: UpdateDeliveryPersonLocationDto): Promise<DeliveryPersonEntity> {
    const deliveryPerson = await this.deliveryPersonRepository.findById(dto.deliveryPersonId);
    
    if (!deliveryPerson) {
      throw new EntityNotFoundException('Entregador', dto.deliveryPersonId);
    }

    // Criar Location (validação automática)
    const newLocation = Location.create(dto.latitude, dto.longitude);

    // Validar anti-spoofing se houver localização anterior
    if (deliveryPerson.currentLocation && deliveryPerson.lastLocationUpdate) {
      const timeDiffMs = new Date().getTime() - deliveryPerson.lastLocationUpdate.getTime();
      const timeDiffMinutes = timeDiffMs / (1000 * 60);

      // Apenas validar se a última atualização foi recente (menos de 1 hora)
      if (timeDiffMinutes < 60) {
        const isReasonable = newLocation.isReasonableDistanceFrom(
          deliveryPerson.currentLocation,
          timeDiffMinutes,
        );

        if (!isReasonable) {
          throw new BusinessRuleException(
            'Movimentação suspeita detectada. A distância percorrida é maior do que o esperado para o tempo decorrido.',
          );
        }
      }
    }

    // Usar método de domínio para atualizar localização
    try {
      deliveryPerson.updateLocation(newLocation);
    } catch (error) {
      throw new BusinessRuleException(error.message);
    }

    return this.deliveryPersonRepository.update(deliveryPerson);
  }
}
