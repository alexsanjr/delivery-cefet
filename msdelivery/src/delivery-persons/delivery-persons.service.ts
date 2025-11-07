import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DeliveryPerson } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryPersonValidationService } from './services/delivery-person-validation.service';
import { DeliveryPersonValidators } from './utils/validators';
import { calculateDistance } from './utils/distance.helper';
import { CreateDeliveryPersonInput } from './dto/create-delivery-person.input';
import { UpdateDeliveryPersonInput } from './dto/update-delivery-person.input';
import { UpdateStatusInput } from './dto/update-status.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { DeliveryPersonStatus } from './models/delivery-person-status.enum';

@Injectable()
export class DeliveryPersonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: DeliveryPersonValidationService,
  ) {}

  async create(createDeliveryPersonInput: CreateDeliveryPersonInput): Promise<DeliveryPerson> {
    // Regra 5: Validar CPF
    DeliveryPersonValidators.validateCpf(createDeliveryPersonInput.cpf);

    await this.validationService.validateEmailUniqueness(createDeliveryPersonInput.email);
    await this.validationService.validateCpfUniqueness(createDeliveryPersonInput.cpf);
    await this.validationService.validatePhoneUniqueness(createDeliveryPersonInput.phone);
    
    if (createDeliveryPersonInput.licensePlate) {
      await this.validationService.validateLicensePlateUniqueness(createDeliveryPersonInput.licensePlate);
    }

    return this.prisma.deliveryPerson.create({
      data: {
        ...createDeliveryPersonInput,
        status: DeliveryPersonStatus.OFFLINE,
      },
    });
  }

  async findAll(status?: DeliveryPersonStatus, isActive?: boolean): Promise<DeliveryPerson[]> {
    return this.prisma.deliveryPerson.findMany({
      where: {
        ...(status && { status }),
        ...(isActive !== undefined && { isActive }),
      },
    });
  }

  async findOne(id: number): Promise<DeliveryPerson> {
    const deliveryPerson = await this.prisma.deliveryPerson.findUnique({
      where: { id },
    });

    if (!deliveryPerson) {
      throw new NotFoundException('Entregador não encontrado');
    }

    return deliveryPerson;
  }

  async update(id: number, updateDeliveryPersonInput: UpdateDeliveryPersonInput): Promise<DeliveryPerson> {
    await this.findOne(id);

    if (updateDeliveryPersonInput.email) {
      await this.validationService.validateEmailUniqueness(updateDeliveryPersonInput.email, id);
    }

    if (updateDeliveryPersonInput.cpf) {
      await this.validationService.validateCpfUniqueness(updateDeliveryPersonInput.cpf, id);
    }

    if (updateDeliveryPersonInput.phone) {
      await this.validationService.validatePhoneUniqueness(updateDeliveryPersonInput.phone, id);
    }

    if (updateDeliveryPersonInput.licensePlate) {
      await this.validationService.validateLicensePlateUniqueness(updateDeliveryPersonInput.licensePlate, id);
    }

    return this.prisma.deliveryPerson.update({
      where: { id },
      data: updateDeliveryPersonInput,
    });
  }

  async updateActiveStatus(id: number, isActive: boolean): Promise<DeliveryPerson> {
    const deliveryPerson = await this.findOne(id);
    
    // Validar se já está no estado desejado
    if (deliveryPerson.isActive === isActive) {
      const statusText = isActive ? 'ativo' : 'desativado';
      throw new BadRequestException(`Entregador já está ${statusText}`);
    }
    
    return this.prisma.deliveryPerson.update({
      where: { id },
      data: { 
        isActive,
        // Se estiver desativando, colocar como OFFLINE
        ...(isActive === false && { status: DeliveryPersonStatus.OFFLINE }),
      },
    });
  }

  async remove(id: number): Promise<DeliveryPerson> {
    await this.findOne(id);
    
    return this.prisma.deliveryPerson.delete({
      where: { id },
    });
  }

  async updateStatus(updateStatusInput: UpdateStatusInput): Promise<DeliveryPerson> {
    const { deliveryPersonId, status } = updateStatusInput;
    
    const deliveryPerson = await this.findOne(deliveryPersonId);

    // Regra 3: Entregador desativado não pode mudar para AVAILABLE ou BUSY
    if (!deliveryPerson.isActive && 
        (status === DeliveryPersonStatus.AVAILABLE || status === DeliveryPersonStatus.BUSY)) {
      throw new BadRequestException(
        "Entregador desativado não pode ficar disponível ou ocupado. Reative o entregador primeiro."
      );
    }

    // Regra 6: Armazenar última localização antes de ficar OFFLINE
    const updateData: any = { status };
    
    if (status === DeliveryPersonStatus.OFFLINE && deliveryPerson.currentLatitude && deliveryPerson.currentLongitude) {
      // Mantém a última localização conhecida mesmo quando offline
      updateData.lastLocationUpdate = new Date();
    }

    return this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: updateData,
    });
  }

  async updateLocation(updateLocationInput: UpdateLocationInput): Promise<DeliveryPerson> {
    const { deliveryPersonId, latitude, longitude } = updateLocationInput;
    
    const deliveryPerson = await this.findOne(deliveryPersonId);

    // Regra 4: Validar coordenadas
    DeliveryPersonValidators.validateCoordinates(latitude, longitude);

    // Regra 4: Não permitir atualização de localização se estiver OFFLINE
    if (deliveryPerson.status === DeliveryPersonStatus.OFFLINE) {
      throw new BadRequestException(
        "Não é possível atualizar localização de entregador offline. Mude o status primeiro."
      );
    }

    // Regra 6: Validar se a distância entre atualizações é razoável (anti-spoofing)
    if (deliveryPerson.currentLatitude && 
        deliveryPerson.currentLongitude && 
        deliveryPerson.lastLocationUpdate) {
      
      const timeDiffMs = new Date().getTime() - new Date(deliveryPerson.lastLocationUpdate).getTime();
      const timeDiffMinutes = timeDiffMs / (1000 * 60);

      // Apenas validar se a última atualização foi recente (menos de 1 hora)
      if (timeDiffMinutes < 60) {
        DeliveryPersonValidators.validateLocationChange(
          deliveryPerson.currentLatitude,
          deliveryPerson.currentLongitude,
          latitude,
          longitude,
          timeDiffMinutes,
        );
      }
    }

    return this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationUpdate: new Date(),
      },
    });
  }

  async findAvailableNearby(latitude: number, longitude: number, radiusKm: number): Promise<DeliveryPerson[]> {
    // Regra 4: Validar coordenadas de busca
    DeliveryPersonValidators.validateCoordinates(latitude, longitude);

    // Regra 3: Apenas entregadores AVAILABLE podem ser atribuídos
    const availableDeliveryPersons = await this.prisma.deliveryPerson.findMany({
      where: {
        status: DeliveryPersonStatus.AVAILABLE,
        isActive: true,
        currentLatitude: { not: null },
        currentLongitude: { not: null },
      },
    });

    return availableDeliveryPersons.filter(person => {
      if (!person.currentLatitude || !person.currentLongitude) {
        return false;
      }

      const distance = DeliveryPersonValidators.calculateDistance(
        latitude,
        longitude,
        person.currentLatitude,
        person.currentLongitude,
      );

      return distance <= radiusKm;
    });
  }
}
