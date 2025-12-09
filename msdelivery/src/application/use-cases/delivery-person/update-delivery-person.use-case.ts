import { Inject, Injectable } from '@nestjs/common';
import { DeliveryPersonEntity } from '../../../domain/entities/delivery-person.entity';
import { 
  IDeliveryPersonRepository, 
  DELIVERY_PERSON_REPOSITORY 
} from '../../../domain/repositories/delivery-person.repository.interface';
import { EntityNotFoundException } from '../../../domain/exceptions/entity-not-found.exception';
import { BusinessRuleException } from '../../../domain/exceptions/business-rule.exception';
import { Email } from '../../../domain/value-objects/email.vo';
import { Phone } from '../../../domain/value-objects/phone.vo';
import { UpdateDeliveryPersonDto } from '../../dtos/delivery-person/update-delivery-person.dto';

@Injectable()
export class UpdateDeliveryPersonUseCase {
  constructor(
    @Inject(DELIVERY_PERSON_REPOSITORY)
    private readonly deliveryPersonRepository: IDeliveryPersonRepository,
  ) {}

  async execute(id: number, dto: UpdateDeliveryPersonDto): Promise<DeliveryPersonEntity> {
    const deliveryPerson = await this.deliveryPersonRepository.findById(id);
    
    if (!deliveryPerson) {
      throw new EntityNotFoundException('Entregador', id);
    }

    // Verificar unicidade de email
    if (dto.email) {
      const email = Email.create(dto.email);
      const existingByEmail = await this.deliveryPersonRepository.findByEmail(email.value);
      if (existingByEmail && existingByEmail.id !== id) {
        throw new BusinessRuleException('Email já cadastrado');
      }
    }

    // Verificar unicidade de telefone
    if (dto.phone) {
      const phone = Phone.create(dto.phone);
      const existingByPhone = await this.deliveryPersonRepository.findByPhone(phone.value);
      if (existingByPhone && existingByPhone.id !== id) {
        throw new BusinessRuleException('Telefone já cadastrado');
      }
    }

    // Verificar unicidade de placa
    if (dto.licensePlate) {
      const existingByLicensePlate = await this.deliveryPersonRepository.findByLicensePlate(dto.licensePlate);
      if (existingByLicensePlate && existingByLicensePlate.id !== id) {
        throw new BusinessRuleException('Placa já cadastrada');
      }
    }

    return this.deliveryPersonRepository.update(
      DeliveryPersonEntity.reconstitute({
        id: deliveryPerson.id,
        name: dto.name ?? deliveryPerson.name,
        email: dto.email ? Email.create(dto.email) : deliveryPerson.email,
        phone: dto.phone ? Phone.create(dto.phone) : deliveryPerson.phone,
        cpf: deliveryPerson.cpf,
        vehicleType: dto.vehicleType ?? deliveryPerson.vehicleType,
        licensePlate: dto.licensePlate ?? deliveryPerson.licensePlate,
        status: deliveryPerson.status,
        rating: deliveryPerson.rating,
        totalDeliveries: deliveryPerson.totalDeliveries,
        currentLocation: deliveryPerson.currentLocation,
        lastLocationUpdate: deliveryPerson.lastLocationUpdate,
        isActive: deliveryPerson.isActive,
        joinedAt: deliveryPerson.joinedAt,
        createdAt: deliveryPerson.createdAt,
        updatedAt: new Date(),
      }),
    );
  }
}
