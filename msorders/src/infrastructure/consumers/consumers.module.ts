import { Module } from '@nestjs/common';
import { CustomersEventsConsumer } from './customers-events.consumer';
import { RabbitMQModule } from '../../rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitMQModule],
  providers: [CustomersEventsConsumer],
  exports: [CustomersEventsConsumer],
})
export class ConsumersModule {}
