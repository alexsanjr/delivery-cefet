import { Inject, Injectable } from '@nestjs/common';
import { DeliveryPersonEntity } from '../../../domain/entities/delivery-person.entity';
import { DeliveryPersonStatus } from '../../../domain/enums/delivery-person-status.enum';
import { 
  IDeliveryPersonRepository, 
  DELIVERY_PERSON_REPOSITORY 
} from '../../../domain/repositories/delivery-person.repository.interface';
import { Email } from '../../../domain/value-objects/email.vo';
import { Phone } from '../../../domain/value-objects/phone.vo';
import { Cpf } from '../../../domain/value-objects/cpf.vo';
import { BusinessRuleException } from '../../../domain/exceptions/business-rule.exception';
import { CreateDeliveryPersonDto } from '../../dtos/delivery-person/create-delivery-person.dto';

@Injectable()
export class CreateDeliveryPersonUseCase {
  constructor(
    @Inject(DELIVERY_PERSON_REPOSITORY)
    private readonly deliveryPersonRepository: IDeliveryPersonRepository,
  ) {}

  async execute(dto: CreateDeliveryPersonDto): Promise<DeliveryPersonEntity> {
    // Criar Value Objects (validação automática)
    const email = Email.create(dto.email);
    const phone = Phone.create(dto.phone);
    const cpf = Cpf.create(dto.cpf);

    // Verificar unicidade
    const existingByEmail = await this.deliveryPersonRepository.findByEmail(email.value);
    if (existingByEmail) {
      throw new BusinessRuleException('Email já cadastrado');
    }

    const existingByCpf = await this.deliveryPersonRepository.findByCpf(cpf.value);
    if (existingByCpf) {
      throw new BusinessRuleException('CPF já cadastrado');
    }

    const existingByPhone = await this.deliveryPersonRepository.findByPhone(phone.value);
    if (existingByPhone) {
      throw new BusinessRuleException('Telefone já cadastrado');
    }

    if (dto.licensePlate) {
      const existingByLicensePlate = await this.deliveryPersonRepository.findByLicensePlate(dto.licensePlate);
      if (existingByLicensePlate) {
        throw new BusinessRuleException('Placa já cadastrada');
      }
    }

    // Criar entidade
    const deliveryPerson = DeliveryPersonEntity.create({
      name: dto.name,
      email,
      phone,
      cpf,
      vehicleType: dto.vehicleType,
      licensePlate: dto.licensePlate,
      status: DeliveryPersonStatus.OFFLINE,
      rating: 5.0,
      totalDeliveries: 0,
      isActive: true,
    });

    // Persistir
    return this.deliveryPersonRepository.save(deliveryPerson);
  }
}
