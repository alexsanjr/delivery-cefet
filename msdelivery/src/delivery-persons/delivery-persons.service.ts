import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryPersonInput } from './dto/create-delivery-person.input';
import { UpdateDeliveryPersonInput } from './dto/update-delivery-person.input';
import { UpdateStatusInput } from './dto/update-status.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { DeliveryPersonStatus } from './models/delivery-person-status.enum';
import { DeliveryPersonValidators } from './utils/validators';

@Injectable()
export class DeliveryPersonsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDeliveryPersonInput: CreateDeliveryPersonInput) {
    DeliveryPersonValidators.validateCpf(createDeliveryPersonInput.cpf);

    const existingCpf = await this.prisma.deliveryPerson.findUnique({
      where: { cpf: createDeliveryPersonInput.cpf },
    });

    if (existingCpf) {
      throw new ConflictException("CPF já cadastrado");
    }

    const existingEmail = await this.prisma.deliveryPerson.findUnique({
      where: { email: createDeliveryPersonInput.email },
    });

    if (existingEmail) {
      throw new ConflictException("Email já cadastrado");
    }

    const existingPhone = await this.prisma.deliveryPerson.findFirst({
      where: { 
        phone: createDeliveryPersonInput.phone,
        isActive: true,
      },
    });

    if (existingPhone) {
      throw new ConflictException("Telefone já cadastrado");
    }


    if (createDeliveryPersonInput.licensePlate && createDeliveryPersonInput.licensePlate.trim() !== '') {
      const existingPlate = await this.prisma.deliveryPerson.findFirst({
        where: { 
          licensePlate: createDeliveryPersonInput.licensePlate,
          isActive: true, 
        },
      });

      if (existingPlate) {
        throw new ConflictException("Placa de carro já cadastrada para outro entregador");
      }
    }

    return this.prisma.deliveryPerson.create({
      data: {
        ...createDeliveryPersonInput,
        status: DeliveryPersonStatus.OFFLINE,
      },
    });
  }

  async findAll(status?: DeliveryPersonStatus, isActive?: boolean) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.deliveryPerson.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const deliveryPerson = await this.prisma.deliveryPerson.findUnique({
      where: { id },
    });

    if (!deliveryPerson) {
      throw new NotFoundException("Entregador não encontrado");
    }

    return deliveryPerson;
  }

  async update(id: string, updateDeliveryPersonInput: UpdateDeliveryPersonInput) {
    await this.findOne(id);

    if (updateDeliveryPersonInput.email) {
      const existingEmail = await this.prisma.deliveryPerson.findFirst({
        where: {
          email: updateDeliveryPersonInput.email,
          NOT: { id },
        },
      });

      if (existingEmail) {
        throw new ConflictException("Email já cadastrado");
      }
    }

    if (updateDeliveryPersonInput.phone) {
      const existingPhone = await this.prisma.deliveryPerson.findFirst({
        where: {
          phone: updateDeliveryPersonInput.phone,
          isActive: true, 
          NOT: { id },
        },
      });

      if (existingPhone) {
        throw new ConflictException("Telefone já cadastrado");
      }
    }

    
    if (updateDeliveryPersonInput.licensePlate && updateDeliveryPersonInput.licensePlate.trim() !== '') {
      const existingPlate = await this.prisma.deliveryPerson.findFirst({
        where: {
          licensePlate: updateDeliveryPersonInput.licensePlate,
          isActive: true, 
          NOT: { id },
        },
      });

      if (existingPlate) {
        throw new ConflictException("Placa já cadastrada para outro entregador");
      }
    }

    return this.prisma.deliveryPerson.update({
      where: { id },
      data: updateDeliveryPersonInput,
    });
  }

  async deactivate(id: string) {
    const deliveryPerson = await this.findOne(id);

    if (!deliveryPerson.isActive) {
      throw new BadRequestException("Entregador já está desativado");
    }

    return this.prisma.deliveryPerson.update({
      where: { id },
      data: { isActive: false, status: DeliveryPersonStatus.OFFLINE },
    });
  }

  async activate(id: string) {
    const deliveryPerson = await this.findOne(id);

    if (deliveryPerson.isActive) {
      throw new BadRequestException("Entregador já está ativo");
    }

    return this.prisma.deliveryPerson.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.deliveryPerson.delete({
      where: { id },
    });
  }

  async updateStatus(updateStatusInput: UpdateStatusInput) {
    const { deliveryPersonId, status } = updateStatusInput;

    const deliveryPerson = await this.findOne(deliveryPersonId);

    if (!deliveryPerson.isActive && 
        (status === DeliveryPersonStatus.AVAILABLE || status === DeliveryPersonStatus.BUSY)) {
      throw new BadRequestException(
        "Entregador desativado não pode ficar disponível ou ocupado. Reative o entregador primeiro."
      );
    }

    const updateData: any = { status };
    
    if (status === DeliveryPersonStatus.OFFLINE && deliveryPerson.currentLatitude && deliveryPerson.currentLongitude) {
      updateData.lastLocationUpdate = new Date();
    }

    return this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: updateData,
    });
  }

  async updateLocation(updateLocationInput: UpdateLocationInput) {
    const { deliveryPersonId, latitude, longitude, accuracy, speed, heading } = updateLocationInput;

    const deliveryPerson = await this.findOne(deliveryPersonId);

    DeliveryPersonValidators.validateCoordinates(latitude, longitude);

    if (deliveryPerson.status === DeliveryPersonStatus.OFFLINE) {
      throw new BadRequestException(
        "Não é possível atualizar localização de entregador offline. Mude o status primeiro."
      );
    }

    if (deliveryPerson.currentLatitude && 
        deliveryPerson.currentLongitude && 
        deliveryPerson.lastLocationUpdate) {
      
      const timeDiffMs = new Date().getTime() - new Date(deliveryPerson.lastLocationUpdate).getTime();
      const timeDiffMinutes = timeDiffMs / (1000 * 60);

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

    const updatedDeliveryPerson = await this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastLocationUpdate: new Date(),
      },
    });

    return updatedDeliveryPerson;
  }

  async findAvailableNearby(latitude: number, longitude: number, radiusKm: number) {
    DeliveryPersonValidators.validateCoordinates(latitude, longitude);

    const deliveryPersons = await this.prisma.deliveryPerson.findMany({
      where: {
        status: DeliveryPersonStatus.AVAILABLE,
        isActive: true,
        currentLatitude: { not: null },
        currentLongitude: { not: null },
      },
    });

    return deliveryPersons.filter((dp) => {
      if (!dp.currentLatitude || !dp.currentLongitude) return false;

      const distance = DeliveryPersonValidators.calculateDistance(
        latitude,
        longitude,
        dp.currentLatitude,
        dp.currentLongitude,
      );

      return distance <= radiusKm;
    });
  }
}
