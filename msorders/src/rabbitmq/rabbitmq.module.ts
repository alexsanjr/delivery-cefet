import { Module, Global, DynamicModule, forwardRef } from '@nestjs/common';
import { RabbitMQService, RabbitMQConfig } from './rabbitmq.service';
import { ProtobufService } from './protobuf.service';
import { OrderEventsPublisher } from './events/order-events.publisher';
import { CustomersRabbitMQClient } from './customers-rabbitmq.client';
import { OrdersRequestConsumer } from './orders-request.consumer';
import { ApplicationModule } from '../application/application.module';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';

@Global()
@Module({})
export class RabbitMQModule {
  static forRoot(config: RabbitMQConfig): DynamicModule {
    return {
      module: RabbitMQModule,
      imports: [forwardRef(() => ApplicationModule), PersistenceModule],
      providers: [
        {
          provide: 'RABBITMQ_CONFIG',
          useValue: config,
        },
        {
          provide: RabbitMQService,
          useFactory: async (cfg: RabbitMQConfig) => {
            const service = new RabbitMQService(cfg);
            await service.onModuleInit(); // Inicializar explicitamente
            return service;
          },
          inject: ['RABBITMQ_CONFIG'],
        },
        ProtobufService,
        OrderEventsPublisher,
        CustomersRabbitMQClient,
        OrdersRequestConsumer,
      ],
      exports: [RabbitMQService, ProtobufService, OrderEventsPublisher, CustomersRabbitMQClient],
    };
  }
}
