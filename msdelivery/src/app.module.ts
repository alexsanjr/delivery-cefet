import { Module } from '@nestjs/common';
import { DeliveryPersonModule } from './infrastructure/modules/delivery-person.module';
import { DeliveryModule } from './infrastructure/modules/delivery.module';
import { MessagingModule } from './infrastructure/messaging/messaging.module';

@Module({
  imports: [
    MessagingModule,
    DeliveryPersonModule,
    DeliveryModule,
  ],
})
export class AppModule {}
