import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from '../services/rabbitmq.service';
import { ROUTING_KEYS } from '../constants/queue.constants';

// Event DTOs
export interface DeliveryCreatedEventDto {
  deliveryId: number;
  orderId: number;
  customerLatitude: number;
  customerLongitude: number;
  customerAddress: string;
  status: string;
  createdAt: string;
}

export interface DeliveryAssignedEventDto {
  deliveryId: number;
  orderId: number;
  deliveryPersonId: number;
  deliveryPersonName: string;
  deliveryPersonPhone: string;
  vehicleType: string;
  estimatedDeliveryTime: number;
  assignedAt: string;
}

export interface DeliveryStatusUpdatedEventDto {
  deliveryId: number;
  orderId: number;
  previousStatus: string;
  newStatus: string;
  updatedAt: string;
  deliveryPersonId?: number;
}

export interface DeliveryCompletedEventDto {
  deliveryId: number;
  orderId: number;
  deliveryPersonId: number;
  deliveredAt: string;
  actualDeliveryTime: number;
}

@Injectable()
export class DeliveryEventPublisher {
  private readonly logger = new Logger(DeliveryEventPublisher.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async publishDeliveryCreated(event: DeliveryCreatedEventDto): Promise<void> {
    try {
      await this.rabbitMQService.publishEvent(
        ROUTING_KEYS.DELIVERY_CREATED,
        'delivery.events.DeliveryCreatedEvent',
        {
          delivery_id: event.deliveryId,
          order_id: event.orderId,
          customer_latitude: event.customerLatitude,
          customer_longitude: event.customerLongitude,
          customer_address: event.customerAddress,
          status: event.status,
          created_at: event.createdAt,
        },
      );
      this.logger.log(`Published DeliveryCreated event for delivery ${event.deliveryId}`);
    } catch (error) {
      this.logger.error(`Failed to publish DeliveryCreated event: ${error}`);
      throw error;
    }
  }

  async publishDeliveryAssigned(event: DeliveryAssignedEventDto): Promise<void> {
    try {
      await this.rabbitMQService.publishEvent(
        ROUTING_KEYS.DELIVERY_ASSIGNED,
        'delivery.events.DeliveryAssignedEvent',
        {
          delivery_id: event.deliveryId,
          order_id: event.orderId,
          delivery_person_id: event.deliveryPersonId,
          delivery_person_name: event.deliveryPersonName,
          delivery_person_phone: event.deliveryPersonPhone,
          vehicle_type: event.vehicleType,
          estimated_delivery_time: event.estimatedDeliveryTime,
          assigned_at: event.assignedAt,
        },
      );
      this.logger.log(`Published DeliveryAssigned event for delivery ${event.deliveryId}`);
    } catch (error) {
      this.logger.error(`Failed to publish DeliveryAssigned event: ${error}`);
      throw error;
    }
  }

  async publishDeliveryStatusUpdated(event: DeliveryStatusUpdatedEventDto): Promise<void> {
    try {
      await this.rabbitMQService.publishEvent(
        ROUTING_KEYS.DELIVERY_STATUS_UPDATED,
        'delivery.events.DeliveryStatusUpdatedEvent',
        {
          delivery_id: event.deliveryId,
          order_id: event.orderId,
          previous_status: event.previousStatus,
          new_status: event.newStatus,
          updated_at: event.updatedAt,
          delivery_person_id: event.deliveryPersonId,
        },
      );
      this.logger.log(`Published DeliveryStatusUpdated event for delivery ${event.deliveryId}`);
    } catch (error) {
      this.logger.error(`Failed to publish DeliveryStatusUpdated event: ${error}`);
      throw error;
    }
  }

  async publishDeliveryCompleted(event: DeliveryCompletedEventDto): Promise<void> {
    try {
      await this.rabbitMQService.publishEvent(
        ROUTING_KEYS.DELIVERY_COMPLETED,
        'delivery.events.DeliveryCompletedEvent',
        {
          delivery_id: event.deliveryId,
          order_id: event.orderId,
          delivery_person_id: event.deliveryPersonId,
          delivered_at: event.deliveredAt,
          actual_delivery_time: event.actualDeliveryTime,
        },
      );
      this.logger.log(`Published DeliveryCompleted event for delivery ${event.deliveryId}`);
    } catch (error) {
      this.logger.error(`Failed to publish DeliveryCompleted event: ${error}`);
      throw error;
    }
  }
}
