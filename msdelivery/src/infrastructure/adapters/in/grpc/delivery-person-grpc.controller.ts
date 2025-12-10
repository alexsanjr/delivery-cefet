import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { DeliveryPersonEntity } from '../../../../domain/entities/delivery-person.entity';
import { DeliveryPersonStatus } from '../../../../domain/enums/delivery-person-status.enum';
import { VehicleType } from '../../../../domain/enums/vehicle-type.enum';
import { 
  CreateDeliveryPersonUseCase,
  ListDeliveryPersonsUseCase,
  GetDeliveryPersonUseCase,
  UpdateDeliveryPersonUseCase,
  DeleteDeliveryPersonUseCase,
  UpdateDeliveryPersonStatusUseCase,
  UpdateDeliveryPersonLocationUseCase,
  ToggleDeliveryPersonActiveUseCase,
  FindAvailableDeliveryPersonsUseCase,
} from '../../../../application/use-cases/delivery-person';
import { EntityNotFoundException } from '../../../../domain/exceptions/entity-not-found.exception';
import { BusinessRuleException } from '../../../../domain/exceptions/business-rule.exception';
import { DomainException } from '../../../../domain/exceptions/domain.exception';

// Valores válidos para status de entregador
const VALID_STATUSES = Object.values(DeliveryPersonStatus);

// Helper para mapear Entity para Response gRPC
function mapToDeliveryPersonInfo(entity: DeliveryPersonEntity) {
  return {
    id: entity.id,
    name: entity.name,
    email: entity.email.value,
    phone: entity.phone.value,
    cpf: entity.cpf.value,
    vehicleType: entity.vehicleType,
    licensePlate: entity.licensePlate || '',
    status: entity.status,
    rating: entity.rating,
    totalDeliveries: entity.totalDeliveries,
    currentLatitude: entity.currentLocation?.latitude || 0,
    currentLongitude: entity.currentLocation?.longitude || 0,
    lastLocationUpdate: entity.lastLocationUpdate?.toISOString() || '',
    isActive: entity.isActive,
    createdAt: entity.createdAt?.toISOString() || '',
    updatedAt: entity.updatedAt?.toISOString() || '',
  };
}

@Controller()
export class DeliveryPersonGrpcController {
  constructor(
    private readonly createDeliveryPersonUseCase: CreateDeliveryPersonUseCase,
    private readonly listDeliveryPersonsUseCase: ListDeliveryPersonsUseCase,
    private readonly getDeliveryPersonUseCase: GetDeliveryPersonUseCase,
    private readonly updateDeliveryPersonUseCase: UpdateDeliveryPersonUseCase,
    private readonly deleteDeliveryPersonUseCase: DeleteDeliveryPersonUseCase,
    private readonly updateDeliveryPersonStatusUseCase: UpdateDeliveryPersonStatusUseCase,
    private readonly updateDeliveryPersonLocationUseCase: UpdateDeliveryPersonLocationUseCase,
    private readonly toggleDeliveryPersonActiveUseCase: ToggleDeliveryPersonActiveUseCase,
    private readonly findAvailableDeliveryPersonsUseCase: FindAvailableDeliveryPersonsUseCase,
  ) {}

  // ==================== QUERIES ====================

  @GrpcMethod('DeliveryPersonService', 'ListAllDeliveryPersons')
  async listAllDeliveryPersons(data: { status?: string }) {
    // Valida se o status é válido
    if (data.status && !VALID_STATUSES.includes(data.status as DeliveryPersonStatus)) {
      throw new RpcException({
        code: 3, // INVALID_ARGUMENT
        message: `Status inválido: "${data.status}". Status válidos: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const status = data.status ? (data.status as DeliveryPersonStatus) : undefined;
    const deliveryPersons = await this.listDeliveryPersonsUseCase.execute(status);
    return { deliveryPersons: deliveryPersons.map(mapToDeliveryPersonInfo) };
  }

  @GrpcMethod('DeliveryPersonService', 'GetDeliveryPerson')
  async getDeliveryPerson(data: { deliveryPersonId: number }) {
    try {
      const deliveryPerson = await this.getDeliveryPersonUseCase.execute(Number(data.deliveryPersonId));
      return {
        success: true,
        deliveryPerson: mapToDeliveryPersonInfo(deliveryPerson),
      };
    } catch (error) {
      return { success: false, deliveryPerson: null };
    }
  }

  @GrpcMethod('DeliveryPersonService', 'FindAvailableDeliveryPersons')
  async findAvailableDeliveryPersons(data: { latitude: number; longitude: number; radiusKm: number; vehicleType?: string }) {
    let deliveryPersons = await this.findAvailableDeliveryPersonsUseCase.execute(
      data.latitude,
      data.longitude,
      data.radiusKm,
    );

    if (data.vehicleType) {
      deliveryPersons = deliveryPersons.filter((dp) => dp.vehicleType === data.vehicleType);
    }

    return { deliveryPersons: deliveryPersons.map(mapToDeliveryPersonInfo) };
  }

  // ==================== MUTATIONS - CRUD ====================

  @GrpcMethod('DeliveryPersonService', 'CreateDeliveryPerson')
  async createDeliveryPerson(data: { name: string; email: string; phone: string; cpf: string; vehicleType: string; licensePlate: string }) {
    try {
      const deliveryPerson = await this.createDeliveryPersonUseCase.execute({
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        vehicleType: data.vehicleType as VehicleType,
        licensePlate: data.licensePlate,
      });
      return {
        success: true,
        message: 'Entregador criado com sucesso',
        deliveryPerson: mapToDeliveryPersonInfo(deliveryPerson),
      };
    } catch (error: any) {
      return { success: false, message: error.message, deliveryPerson: null };
    }
  }

  @GrpcMethod('DeliveryPersonService', 'UpdateDeliveryPerson')
  async updateDeliveryPerson(data: { id: number; name?: string; email?: string; phone?: string; vehicleType?: string; licensePlate?: string }) {
    try {
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.email) updateData.email = data.email;
      if (data.phone) updateData.phone = data.phone;
      if (data.vehicleType) updateData.vehicleType = data.vehicleType as VehicleType;
      if (data.licensePlate) updateData.licensePlate = data.licensePlate;

      const deliveryPerson = await this.updateDeliveryPersonUseCase.execute(Number(data.id), updateData);
      return {
        success: true,
        message: 'Entregador atualizado com sucesso',
        deliveryPerson: mapToDeliveryPersonInfo(deliveryPerson),
      };
    } catch (error: any) {
      return { success: false, message: error.message, deliveryPerson: null };
    }
  }

  @GrpcMethod('DeliveryPersonService', 'DeleteDeliveryPerson')
  async deleteDeliveryPerson(data: { id: number }) {
    try {
      const deliveryPerson = await this.getDeliveryPersonUseCase.execute(Number(data.id));
      await this.deleteDeliveryPersonUseCase.execute(Number(data.id));
      return {
        success: true,
        message: 'Entregador removido com sucesso',
        deliveryPerson: mapToDeliveryPersonInfo(deliveryPerson),
      };
    } catch (error: any) {
      return { success: false, message: error.message, deliveryPerson: null };
    }
  }

  // ==================== MUTATIONS - STATUS E LOCALIZAÇÃO ====================

  @GrpcMethod('DeliveryPersonService', 'UpdateDeliveryPersonStatus')
  async updateDeliveryPersonStatus(data: { deliveryPersonId: number; status: string }) {
    // Valida se o status é válido
    if (!VALID_STATUSES.includes(data.status as DeliveryPersonStatus)) {
      return {
        success: false,
        message: `Status inválido: "${data.status}". Status válidos: ${VALID_STATUSES.join(', ')}`,
        deliveryPerson: null,
      };
    }

    try {
      const deliveryPerson = await this.updateDeliveryPersonStatusUseCase.execute({
        deliveryPersonId: Number(data.deliveryPersonId),
        status: data.status as DeliveryPersonStatus,
      });
      return {
        success: true,
        message: 'Status atualizado com sucesso',
        deliveryPerson: mapToDeliveryPersonInfo(deliveryPerson),
      };
    } catch (error: any) {
      return { success: false, message: error.message, deliveryPerson: null };
    }
  }

  @GrpcMethod('DeliveryPersonService', 'UpdateDeliveryPersonLocation')
  async updateDeliveryPersonLocation(data: { deliveryPersonId: number; latitude: number; longitude: number }) {
    try {
      const deliveryPerson = await this.updateDeliveryPersonLocationUseCase.execute({
        deliveryPersonId: Number(data.deliveryPersonId),
        latitude: data.latitude,
        longitude: data.longitude,
      });
      return {
        success: true,
        message: 'Localização atualizada com sucesso',
        deliveryPerson: mapToDeliveryPersonInfo(deliveryPerson),
      };
    } catch (error: any) {
      return { success: false, message: error.message, deliveryPerson: null };
    }
  }

  @GrpcMethod('DeliveryPersonService', 'ActivateDeliveryPerson')
  async activateDeliveryPerson(data: { id: number }) {
    try {
      const deliveryPerson = await this.toggleDeliveryPersonActiveUseCase.execute(
        Number(data.id),
        true,
      );
      return {
        success: true,
        message: 'Entregador ativado com sucesso',
        deliveryPerson: mapToDeliveryPersonInfo(deliveryPerson),
      };
    } catch (error: any) {
      return { success: false, message: error.message, deliveryPerson: null };
    }
  }

  @GrpcMethod('DeliveryPersonService', 'DeactivateDeliveryPerson')
  async deactivateDeliveryPerson(data: { id: number }) {
    try {
      const deliveryPerson = await this.toggleDeliveryPersonActiveUseCase.execute(
        Number(data.id),
        false,
      );
      return {
        success: true,
        message: 'Entregador desativado com sucesso',
        deliveryPerson: mapToDeliveryPersonInfo(deliveryPerson),
      };
    } catch (error: any) {
      return { success: false, message: error.message, deliveryPerson: null };
    }
  }
}
