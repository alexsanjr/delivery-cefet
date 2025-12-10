import { Module, Global, DynamicModule } from '@nestjs/common';
import { RabbitMQService, RabbitMQConfig } from './rabbitmq.service';
import { ProtobufService } from './protobuf.service';
import { OrderEventsPublisher } from './events/order-events.publisher';

@Global()
@Module({})
export class RabbitMQModule {
  static forRoot(config: RabbitMQConfig): DynamicModule {
    const rabbitMQService = new RabbitMQService(config);

    return {
      module: RabbitMQModule,
      providers: [
        {
          provide: RabbitMQService,
          useValue: rabbitMQService,
        },
        ProtobufService,
        OrderEventsPublisher,
      ],
      exports: [RabbitMQService, ProtobufService, OrderEventsPublisher],
    };
  }
}
