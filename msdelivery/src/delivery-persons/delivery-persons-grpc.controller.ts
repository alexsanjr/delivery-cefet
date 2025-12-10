import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { DeliveryPersonsService } from './delivery-persons.service';
import { DeliveryPersonStatus } from './models/delivery-person-status.enum';
import { VehicleType } from './models/vehicle-type.enum';

// Valores válidos para status de entregador
const VALID_STATUSES = Object.values(DeliveryPersonStatus);

// Helper para mapear DeliveryPerson para DeliveryPersonInfo
function mapToDeliveryPersonInfo(dp: any) {
  return {
    id: dp.id,
    name: dp.name,
    email: dp.email,
    phone: dp.phone,
    cpf: dp.cpf || '',
    vehicleType: dp.vehicleType,
    licensePlate: dp.licensePlate || '',
    status: dp.status,
    rating: dp.rating,
    totalDeliveries: dp.totalDeliveries,
    currentLatitude: dp.currentLatitude || 0,
    currentLongitude: dp.currentLongitude || 0,
    lastLocationUpdate: dp.lastLocationUpdate?.toISOString() || '',
    isActive: dp.isActive,
    createdAt: dp.createdAt?.toISOString() || '',
    updatedAt: dp.updatedAt?.toISOString() || '',
  };
}

@Controller()
export class DeliveryPersonsGrpcController {
  constructor(private readonly deliveryPersonsService: DeliveryPersonsService) {}

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
    const deliveryPersons = await this.deliveryPersonsService.findAll(status);
    return { deliveryPersons: deliveryPersons.map(mapToDeliveryPersonInfo) };
  }

  @GrpcMethod('DeliveryPersonService', 'GetDeliveryPerson')
  async getDeliveryPerson(data: { deliveryPersonId: number }) {
    try {
      const deliveryPerson = await this.deliveryPersonsService.findOne(Number(data.deliveryPersonId));
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
    let deliveryPersons = await this.deliveryPersonsService.findAvailableNearby(
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
      const deliveryPerson = await this.deliveryPersonsService.create({
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
    } catch (error) {
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

      const deliveryPerson = await this.deliveryPersonsService.update(Number(data.id), updateData);
      return {
        success: true,
        message: 'Entregador atualizado com sucesso',
        deliveryPerson: mapToDeliveryPersonInfo(deliveryPerson),
      };
    } catch (error) {
      return { success: false, message: error.message, deliveryPerson: null };
    }
  }

  @GrpcMethod('DeliveryPersonService', 'DeleteDeliveryPerson')
  async deleteDeliveryPerson(data: { id: number }) {
    try {
      const deliveryPerson = await this.deliveryPersonsService.remove(Number(data.id));
      return {
        success: true,
        message: 'Entregador removido com sucesso',
        deliveryPerson: mapToDeliveryPersonInfo(deliveryPerson),
      };
    } catch (error) {
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
      const deliveryPerson = await this.deliveryPersonsService.updateStatus({
        deliveryPersonId: Number(data.deliveryPersonId),
        status: data.status as DeliveryPersonStatus,
      });
      return {
        success: true,
        message: 'Status atualizado com sucesso',
        deliveryPerson: mapToDeliveryPersonInfo(deliveryPerson),
      };
    } catch (error) {
      return { success: false, message: error.message, deliveryPerson: null };
    }
  }

  @GrpcMethod('DeliveryPersonService', 'UpdateDeliveryPersonLocation')
  async updateDeliveryPersonLocation(data: { deliveryPersonId: number; latitude: number; longitude: number; speed?: number; heading?: number; accuracy?: number }) {
    try {
      const deliveryPerson = await this.deliveryPersonsService.updateLocation({
        deliveryPersonId: Number(data.deliveryPersonId),
        latitude: data.latitude,
        longitude: data.longitude,
      });
      return {
        success: true,
        message: 'Localização atualizada com sucesso',
        deliveryPerson: mapToDeliveryPersonInfo(deliveryPerson),
      };
    } catch (error) {
      return { success: false, message: error.message, deliveryPerson: null };
    }
  }

  // ==================== MUTATIONS - ATIVAR/DESATIVAR ====================

  @GrpcMethod('DeliveryPersonService', 'ActivateDeliveryPerson')
  async activateDeliveryPerson(data: { id: number }) {
    try {
      const deliveryPerson = await this.deliveryPersonsService.updateActiveStatus(Number(data.id), true);
      return {
        success: true,
        message: 'Entregador ativado com sucesso',
        deliveryPerson: mapToDeliveryPersonInfo(deliveryPerson),
      };
    } catch (error) {
      return { success: false, message: error.message, deliveryPerson: null };
    }
  }

  @GrpcMethod('DeliveryPersonService', 'DeactivateDeliveryPerson')
  async deactivateDeliveryPerson(data: { id: number }) {
    try {
      const deliveryPerson = await this.deliveryPersonsService.updateActiveStatus(Number(data.id), false);
      return {
        success: true,
        message: 'Entregador desativado com sucesso',
        deliveryPerson: mapToDeliveryPersonInfo(deliveryPerson),
      };
    } catch (error) {
      return { success: false, message: error.message, deliveryPerson: null };
    }
  }
}
