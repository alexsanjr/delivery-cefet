import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from '../services/rabbitmq.service';
import { ROUTING_KEYS } from '../constants/queue.constants';

// Event DTOs
export interface DeliveryPersonCreatedEventDto {
  deliveryPersonId: number;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  vehicleType: string;
  status: string;
  createdAt: string;
}

export interface DeliveryPersonStatusUpdatedEventDto {
  deliveryPersonId: number;
  previousStatus: string;
  newStatus: string;
  updatedAt: string;
}

export interface DeliveryPersonLocationUpdatedEventDto {
  deliveryPersonId: number;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

@Injectable()
export class DeliveryPersonEventPublisher {
  private readonly logger = new Logger(DeliveryPersonEventPublisher.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async publishDeliveryPersonCreated(event: DeliveryPersonCreatedEventDto): Promise<void> {
    try {
      await this.rabbitMQService.publishEvent(
        ROUTING_KEYS.DELIVERY_PERSON_CREATED,
        'delivery.events.DeliveryPersonCreatedEvent',
        {
          delivery_person_id: event.deliveryPersonId,
          name: event.name,
          cpf: event.cpf,
          email: event.email,
          phone: event.phone,
          vehicle_type: event.vehicleType,
          status: event.status,
          created_at: event.createdAt,
        },
      );
      this.logger.log(`Published DeliveryPersonCreated event for delivery person ${event.deliveryPersonId}`);
    } catch (error) {
      this.logger.error(`Failed to publish DeliveryPersonCreated event: ${error}`);
      throw error;
    }
  }

  async publishDeliveryPersonStatusUpdated(event: DeliveryPersonStatusUpdatedEventDto): Promise<void> {
    try {
      await this.rabbitMQService.publishEvent(
        ROUTING_KEYS.DELIVERY_PERSON_STATUS_UPDATED,
        'delivery.events.DeliveryPersonStatusUpdatedEvent',
        {
          delivery_person_id: event.deliveryPersonId,
          previous_status: event.previousStatus,
          new_status: event.newStatus,
          updated_at: event.updatedAt,
        },
      );
      this.logger.log(`Published DeliveryPersonStatusUpdated event for delivery person ${event.deliveryPersonId}`);
    } catch (error) {
      this.logger.error(`Failed to publish DeliveryPersonStatusUpdated event: ${error}`);
      throw error;
    }
  }

  async publishDeliveryPersonLocationUpdated(event: DeliveryPersonLocationUpdatedEventDto): Promise<void> {
    try {
      await this.rabbitMQService.publishEvent(
        ROUTING_KEYS.DELIVERY_PERSON_LOCATION_UPDATED,
        'delivery.events.DeliveryPersonLocationUpdatedEvent',
        {
          delivery_person_id: event.deliveryPersonId,
          latitude: event.latitude,
          longitude: event.longitude,
          updated_at: event.updatedAt,
        },
      );
      this.logger.log(`Published DeliveryPersonLocationUpdated event for delivery person ${event.deliveryPersonId}`);
    } catch (error) {
      this.logger.error(`Failed to publish DeliveryPersonLocationUpdated event: ${error}`);
      throw error;
    }
  }
}
