import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../services/rabbitmq.service';
import { QUEUE_NAMES } from '../constants/queue.constants';

// Command DTOs
export interface AssignDeliveryCommandDto {
  orderId: number;
  deliveryPersonId: number;
  correlationId: string;
  timestamp: string;
}

export interface CreateDeliveryCommandDto {
  orderId: number;
  customerLatitude: number;
  customerLongitude: number;
  customerAddress: string;
  correlationId: string;
  timestamp: string;
}

export interface UpdateDeliveryStatusCommandDto {
  deliveryId: number;
  status: string;
  correlationId: string;
  timestamp: string;
}

export type CommandHandler<T> = (command: T) => Promise<void>;

@Injectable()
export class DeliveryCommandConsumer implements OnModuleInit {
  private readonly logger = new Logger(DeliveryCommandConsumer.name);

  private assignDeliveryHandler?: CommandHandler<AssignDeliveryCommandDto>;
  private createDeliveryHandler?: CommandHandler<CreateDeliveryCommandDto>;
  private updateStatusHandler?: CommandHandler<UpdateDeliveryStatusCommandDto>;

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async onModuleInit(): Promise<void> {
    // Delay to ensure RabbitMQ is connected
    setTimeout(() => this.setupConsumers(), 2000);
  }

  private async setupConsumers(): Promise<void> {
    try {
      // Consume AssignDeliveryCommand
      await this.rabbitMQService.consume<{
        order_id: number;
        delivery_person_id: number;
        correlation_id: string;
        timestamp: string;
      }>(
        QUEUE_NAMES.ASSIGN_DELIVERY_COMMAND,
        'delivery.events.AssignDeliveryCommand',
        async (data) => {
          const command: AssignDeliveryCommandDto = {
            orderId: data.order_id,
            deliveryPersonId: data.delivery_person_id,
            correlationId: data.correlation_id,
            timestamp: data.timestamp,
          };

          this.logger.log(`Received AssignDeliveryCommand: ${JSON.stringify(command)}`);
          
          if (this.assignDeliveryHandler) {
            await this.assignDeliveryHandler(command);
          }
        },
      );

      // Consume CreateDeliveryCommand
      await this.rabbitMQService.consume<{
        order_id: number;
        customer_latitude: number;
        customer_longitude: number;
        customer_address: string;
        correlation_id: string;
        timestamp: string;
      }>(
        QUEUE_NAMES.CREATE_DELIVERY_COMMAND,
        'delivery.events.CreateDeliveryCommand',
        async (data) => {
          const command: CreateDeliveryCommandDto = {
            orderId: data.order_id,
            customerLatitude: data.customer_latitude,
            customerLongitude: data.customer_longitude,
            customerAddress: data.customer_address,
            correlationId: data.correlation_id,
            timestamp: data.timestamp,
          };

          this.logger.log(`Received CreateDeliveryCommand: ${JSON.stringify(command)}`);
          
          if (this.createDeliveryHandler) {
            await this.createDeliveryHandler(command);
          }
        },
      );

      // Consume UpdateDeliveryStatusCommand
      await this.rabbitMQService.consume<{
        delivery_id: number;
        status: string;
        correlation_id: string;
        timestamp: string;
      }>(
        QUEUE_NAMES.UPDATE_DELIVERY_STATUS_COMMAND,
        'delivery.events.UpdateDeliveryStatusCommand',
        async (data) => {
          const command: UpdateDeliveryStatusCommandDto = {
            deliveryId: data.delivery_id,
            status: data.status,
            correlationId: data.correlation_id,
            timestamp: data.timestamp,
          };

          this.logger.log(`Received UpdateDeliveryStatusCommand: ${JSON.stringify(command)}`);
          
          if (this.updateStatusHandler) {
            await this.updateStatusHandler(command);
          }
        },
      );

      this.logger.log('Delivery command consumers setup completed');
    } catch (error) {
      this.logger.error(`Failed to setup consumers: ${error}`);
    }
  }

  setAssignDeliveryHandler(handler: CommandHandler<AssignDeliveryCommandDto>): void {
    this.assignDeliveryHandler = handler;
  }

  setCreateDeliveryHandler(handler: CommandHandler<CreateDeliveryCommandDto>): void {
    this.createDeliveryHandler = handler;
  }

  setUpdateStatusHandler(handler: CommandHandler<UpdateDeliveryStatusCommandDto>): void {
    this.updateStatusHandler = handler;
  }
}
