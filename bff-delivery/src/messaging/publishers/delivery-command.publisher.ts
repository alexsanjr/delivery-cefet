import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from '../services/rabbitmq.service';
import { QUEUE_NAMES } from '../constants/queue.constants';

export interface AssignDeliveryCommandDto {
  orderId: number;
  deliveryPersonId?: number;
  correlationId?: string;
}

export interface CreateDeliveryCommandDto {
  orderId: number;
  customerLatitude: number;
  customerLongitude: number;
  customerAddress: string;
  correlationId?: string;
}

export interface UpdateDeliveryStatusCommandDto {
  deliveryId: number;
  status: string;
  correlationId?: string;
}

@Injectable()
export class DeliveryCommandPublisher {
  private readonly logger = new Logger(DeliveryCommandPublisher.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async publishAssignDeliveryCommand(command: AssignDeliveryCommandDto): Promise<string> {
    const correlationId = command.correlationId || this.generateCorrelationId();
    
    try {
      await this.rabbitMQService.publishCommand(
        QUEUE_NAMES.ASSIGN_DELIVERY_COMMAND,
        'delivery.events.AssignDeliveryCommand',
        {
          order_id: command.orderId,
          delivery_person_id: command.deliveryPersonId || 0,
          correlation_id: correlationId,
          timestamp: new Date().toISOString(),
        },
        correlationId,
      );
      
      this.logger.log(`Published AssignDeliveryCommand for order ${command.orderId} with correlationId ${correlationId}`);
      return correlationId;
    } catch (error) {
      this.logger.error(`Failed to publish AssignDeliveryCommand: ${error}`);
      throw error;
    }
  }

  async publishCreateDeliveryCommand(command: CreateDeliveryCommandDto): Promise<string> {
    const correlationId = command.correlationId || this.generateCorrelationId();
    
    try {
      await this.rabbitMQService.publishCommand(
        QUEUE_NAMES.CREATE_DELIVERY_COMMAND,
        'delivery.events.CreateDeliveryCommand',
        {
          order_id: command.orderId,
          customer_latitude: command.customerLatitude,
          customer_longitude: command.customerLongitude,
          customer_address: command.customerAddress,
          correlation_id: correlationId,
          timestamp: new Date().toISOString(),
        },
        correlationId,
      );
      
      this.logger.log(`Published CreateDeliveryCommand for order ${command.orderId} with correlationId ${correlationId}`);
      return correlationId;
    } catch (error) {
      this.logger.error(`Failed to publish CreateDeliveryCommand: ${error}`);
      throw error;
    }
  }

  async publishUpdateDeliveryStatusCommand(command: UpdateDeliveryStatusCommandDto): Promise<string> {
    const correlationId = command.correlationId || this.generateCorrelationId();
    
    try {
      await this.rabbitMQService.publishCommand(
        QUEUE_NAMES.UPDATE_DELIVERY_STATUS_COMMAND,
        'delivery.events.UpdateDeliveryStatusCommand',
        {
          delivery_id: command.deliveryId,
          status: command.status,
          correlation_id: correlationId,
          timestamp: new Date().toISOString(),
        },
        correlationId,
      );
      
      this.logger.log(`Published UpdateDeliveryStatusCommand for delivery ${command.deliveryId} with correlationId ${correlationId}`);
      return correlationId;
    } catch (error) {
      this.logger.error(`Failed to publish UpdateDeliveryStatusCommand: ${error}`);
      throw error;
    }
  }

  private generateCorrelationId(): string {
    return `bff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
