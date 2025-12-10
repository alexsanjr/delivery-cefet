import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { DeliveryPersonsService } from '../delivery-persons/delivery-persons.service';

@Controller()
export class DeliveryGrpcController {
  constructor(
    private readonly deliveriesService: DeliveriesService,
    private readonly deliveryPersonsService: DeliveryPersonsService,
  ) {}

  @GrpcMethod('DeliveryService', 'GetDeliveryByOrder')
  async getDeliveryByOrder(data: { orderId: number }) {
    try {
      const delivery = await this.deliveriesService.findByOrderId(data.orderId);
      
      if (!delivery) {
        return {
          success: false,
          message: 'Entrega não encontrada',
          delivery: null,
        };
      }

      return {
        success: true,
        message: 'Entrega encontrada',
        delivery: this.mapDeliveryToProto(delivery),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        delivery: null,
      };
    }
  }

  @GrpcMethod('DeliveryService', 'GetActiveDeliveries')
  async getActiveDeliveries(data: { statuses: string[] }) {
    try {
      const deliveries = await this.deliveriesService.findByStatuses(data.statuses || []);

      return {
        success: true,
        deliveries: deliveries.map(d => this.mapDeliveryToProto(d)),
      };
    } catch (error) {
      return {
        success: false,
        deliveries: [],
      };
    }
  }

  @GrpcMethod('DeliveryService', 'GetDeliveriesByDeliveryPerson')
  async getDeliveriesByDeliveryPerson(data: { deliveryPersonId: number }) {
    try {
      const deliveries = await this.deliveriesService.findByDeliveryPersonId(data.deliveryPersonId);

      return {
        success: true,
        deliveries: deliveries.map(d => this.mapDeliveryToProto(d)),
      };
    } catch (error) {
      return {
        success: false,
        deliveries: [],
      };
    }
  }

  @GrpcMethod('DeliveryService', 'GetDeliveryPersonLocation')
  async getDeliveryPersonLocation(data: { deliveryPersonId: number }) {
    try {
      const person = await this.deliveryPersonsService.findOne(data.deliveryPersonId);

      if (!person) {
        return {
          success: false,
          message: 'Entregador não encontrado',
          location: null,
        };
      }

      return {
        success: true,
        message: 'Localização encontrada',
        location: {
          id: person.id,
          name: person.name,
          currentLatitude: person.currentLatitude,
          currentLongitude: person.currentLongitude,
          lastLocationUpdate: person.lastLocationUpdate?.toISOString(),
          status: person.status,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        location: null,
      };
    }
  }

  @GrpcMethod('DeliveryService', 'UpdateDeliveryStatus')
  async updateDeliveryStatus(data: { deliveryId: number; status: string }) {
    try {
      const delivery = await this.deliveriesService.updateStatus(data.deliveryId, data.status);

      return {
        success: true,
        message: 'Status atualizado com sucesso',
        delivery: this.mapDeliveryToProto(delivery),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        delivery: null,
      };
    }
  }

  @GrpcMethod('DeliveryService', 'AssignDelivery')
  async assignDelivery(data: { orderId: number; deliveryPersonId?: number }) {
    try {
      const delivery = await this.deliveriesService.assignDelivery(
        data.orderId,
        data.deliveryPersonId,
      );

      return {
        success: true,
        message: 'Entrega atribuída com sucesso',
        delivery: this.mapDeliveryToProto(delivery),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        delivery: null,
      };
    }
  }

  @GrpcMethod('DeliveryService', 'CreateDelivery')
  async createDelivery(data: { 
    orderId: number; 
    customerLatitude: number;
    customerLongitude: number;
    customerAddress: string;
  }) {
    try {
      const delivery = await this.deliveriesService.create(data);

      return {
        success: true,
        message: 'Entrega criada com sucesso',
        delivery: this.mapDeliveryToProto(delivery),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        delivery: null,
      };
    }
  }

  private mapDeliveryToProto(delivery: any) {
    return {
      id: delivery.id,
      orderId: delivery.orderId,
      deliveryPersonId: delivery.deliveryPersonId,
      status: delivery.status,
      customerLatitude: delivery.customerLatitude,
      customerLongitude: delivery.customerLongitude,
      customerAddress: delivery.customerAddress,
      assignedAt: delivery.assignedAt?.toISOString(),
      pickedUpAt: delivery.pickedUpAt?.toISOString(),
      deliveredAt: delivery.deliveredAt?.toISOString(),
      estimatedDeliveryTime: delivery.estimatedDeliveryTime,
      deliveryPerson: delivery.deliveryPerson ? {
        id: delivery.deliveryPerson.id,
        name: delivery.deliveryPerson.name,
        phone: delivery.deliveryPerson.phone,
        vehicleType: delivery.deliveryPerson.vehicleType,
        currentLatitude: delivery.deliveryPerson.currentLatitude,
        currentLongitude: delivery.deliveryPerson.currentLongitude,
        status: delivery.deliveryPerson.status,
      } : null,
    };
  }
}
