import { Inject, Injectable } from '@nestjs/common';
import { DeliveryPersonEntity } from '../../../domain/entities/delivery-person.entity';
import { 
  IDeliveryPersonRepository, 
  DELIVERY_PERSON_REPOSITORY 
} from '../../../domain/repositories/delivery-person.repository.interface';
import { Location } from '../../../domain/value-objects/location.vo';

@Injectable()
export class FindAvailableDeliveryPersonsUseCase {
  constructor(
    @Inject(DELIVERY_PERSON_REPOSITORY)
    private readonly deliveryPersonRepository: IDeliveryPersonRepository,
  ) {}

  async execute(latitude: number, longitude: number, radiusKm: number): Promise<DeliveryPersonEntity[]> {
    // Validar coordenadas
    Location.create(latitude, longitude);

    return this.deliveryPersonRepository.findAvailableNearby(latitude, longitude, radiusKm);
  }
}
