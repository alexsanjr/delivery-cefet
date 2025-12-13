import { Module, forwardRef } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [PrismaModule, RabbitMQModule.forRoot()],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
