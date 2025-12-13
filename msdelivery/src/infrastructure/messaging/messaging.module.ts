import { Module, Global } from '@nestjs/common';
import { RabbitMQService } from './services/rabbitmq.service';
import { DeliveryEventPublisher } from './publishers/delivery-event.publisher';
import { DeliveryPersonEventPublisher } from './publishers/delivery-person-event.publisher';
import { DeliveryCommandConsumer } from './consumers/delivery-command.consumer';
import { OrderEventConsumer } from './consumers/order-event.consumer';

@Global()
@Module({
  providers: [
    RabbitMQService,
    DeliveryEventPublisher,
    DeliveryPersonEventPublisher,
    DeliveryCommandConsumer,
    OrderEventConsumer,
  ],
  exports: [
    RabbitMQService,
    DeliveryEventPublisher,
    DeliveryPersonEventPublisher,
    DeliveryCommandConsumer,
    OrderEventConsumer,
  ],
})
export class MessagingModule {}
