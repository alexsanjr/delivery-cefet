import { DynamicModule, Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { OrdersRabbitMQClient } from './orders-rabbitmq.client';

@Module({})
export class RabbitMQModule {
  static forRoot(): DynamicModule {
    return {
      module: RabbitMQModule,
      providers: [
        RabbitMQService,
        OrdersRabbitMQClient,
      ],
      exports: [
        OrdersRabbitMQClient,
      ],
      global: true,
    };
  }
}
