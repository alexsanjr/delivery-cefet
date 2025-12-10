import { Module, Global } from '@nestjs/common';
import { RabbitMQService } from './services/rabbitmq.service';
import { DeliveryCommandPublisher } from './publishers/delivery-command.publisher';

@Global()
@Module({
  providers: [
    RabbitMQService,
    DeliveryCommandPublisher,
  ],
  exports: [
    RabbitMQService,
    DeliveryCommandPublisher,
  ],
})
export class MessagingModule {}
