import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { DeliveryEntity } from '../../../../domain/entities/delivery.entity';
import { DeliveryStatus } from '../../../../domain/enums/delivery-status.enum';
import {
  CreateDeliveryUseCase,
  GetDeliveryByOrderIdUseCase,
  ListDeliveriesByStatusUseCase,
  ListDeliveriesByDeliveryPersonUseCase,
  AssignDeliveryUseCase,
  UpdateDeliveryStatusUseCase,
} from '../../../../application/use-cases/delivery';

// Valores válidos para status de entrega
const VALID_STATUSES = Object.values(DeliveryStatus);

// Helper para mapear Entity para Response gRPC
function mapToDeliveryInfo(entity: DeliveryEntity) {
  return {
    id: entity.id,
    orderId: entity.orderId,
    deliveryPersonId: entity.deliveryPersonId || 0,
    status: entity.status,
    customerLatitude: entity.customerLocation.latitude,
    customerLongitude: entity.customerLocation.longitude,
    customerAddress: entity.customerAddress,
    assignedAt: entity.assignedAt?.toISOString() || '',
    pickedUpAt: entity.pickedUpAt?.toISOString() || '',
    deliveredAt: entity.deliveredAt?.toISOString() || '',
    cancelledAt: entity.cancelledAt?.toISOString() || '',
    estimatedDeliveryTime: entity.estimatedDeliveryTime || 0,
    actualDeliveryTime: entity.actualDeliveryTime || 0,
    createdAt: entity.createdAt?.toISOString() || '',
    updatedAt: entity.updatedAt?.toISOString() || '',
  };
}

@Controller()
export class DeliveryGrpcController {
  constructor(
    private readonly createDeliveryUseCase: CreateDeliveryUseCase,
    private readonly getDeliveryByOrderIdUseCase: GetDeliveryByOrderIdUseCase,
    private readonly listDeliveriesByStatusUseCase: ListDeliveriesByStatusUseCase,
    private readonly listDeliveriesByDeliveryPersonUseCase: ListDeliveriesByDeliveryPersonUseCase,
    private readonly assignDeliveryUseCase: AssignDeliveryUseCase,
    private readonly updateDeliveryStatusUseCase: UpdateDeliveryStatusUseCase,
  ) {}

  // ==================== QUERIES ====================

  @GrpcMethod('DeliveryService', 'GetDeliveryByOrder')
  async getDeliveryByOrder(data: { orderId: number }) {
    try {
      const delivery = await this.getDeliveryByOrderIdUseCase.execute(Number(data.orderId));
      return {
        success: true,
        message: 'Entrega encontrada',
        delivery: mapToDeliveryInfo(delivery),
      };
    } catch (error) {
      return { success: false, message: 'Entrega não encontrada', delivery: null };
    }
  }

  @GrpcMethod('DeliveryService', 'GetActiveDeliveries')
  async getActiveDeliveries(data: { statuses: string[] }) {
    const statuses = (data.statuses || []).map((s) => s as DeliveryStatus);
    const deliveries = await this.listDeliveriesByStatusUseCase.execute(statuses);
    return { 
      success: true,
      deliveries: deliveries.map(mapToDeliveryInfo) 
    };
  }

  @GrpcMethod('DeliveryService', 'GetDeliveriesByDeliveryPerson')
  async getDeliveriesByDeliveryPerson(data: { deliveryPersonId: number }) {
    const deliveries = await this.listDeliveriesByDeliveryPersonUseCase.execute(Number(data.deliveryPersonId));
    return { 
      success: true,
      deliveries: deliveries.map(mapToDeliveryInfo) 
    };
  }

  // ==================== MUTATIONS ====================

  @GrpcMethod('DeliveryService', 'CreateDelivery')
  async createDelivery(data: { orderId: number; customerLatitude: number; customerLongitude: number; customerAddress: string }) {
    try {
      const delivery = await this.createDeliveryUseCase.execute({
        orderId: Number(data.orderId),
        customerLatitude: data.customerLatitude,
        customerLongitude: data.customerLongitude,
        customerAddress: data.customerAddress,
      });
      return {
        success: true,
        message: 'Entrega criada com sucesso',
        delivery: mapToDeliveryInfo(delivery),
      };
    } catch (error: any) {
      return { success: false, message: error.message, delivery: null };
    }
  }

  @GrpcMethod('DeliveryService', 'AssignDelivery')
  async assignDelivery(data: { orderId: number; deliveryPersonId?: number }) {
    try {
      const delivery = await this.assignDeliveryUseCase.execute({
        orderId: Number(data.orderId),
        deliveryPersonId: data.deliveryPersonId ? Number(data.deliveryPersonId) : undefined,
      });
      return {
        success: true,
        message: 'Entrega atribuída com sucesso',
        delivery: mapToDeliveryInfo(delivery),
      };
    } catch (error: any) {
      return { success: false, message: error.message, delivery: null };
    }
  }

  @GrpcMethod('DeliveryService', 'UpdateDeliveryStatus')
  async updateDeliveryStatus(data: { deliveryId: number; status: string }) {
    // Validar status
    if (!VALID_STATUSES.includes(data.status as DeliveryStatus)) {
      return {
        success: false,
        message: `Status inválido: "${data.status}". Status válidos: ${VALID_STATUSES.join(', ')}`,
        delivery: null,
      };
    }

    try {
      const delivery = await this.updateDeliveryStatusUseCase.execute({
        deliveryId: Number(data.deliveryId),
        status: data.status as DeliveryStatus,
      });
      return {
        success: true,
        message: 'Status da entrega atualizado com sucesso',
        delivery: mapToDeliveryInfo(delivery),
      };
    } catch (error: any) {
      return { success: false, message: error.message, delivery: null };
    }
  }
}
