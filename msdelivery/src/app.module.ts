import { Module } from '@nestjs/common';
import { DeliveryPersonModule } from './infrastructure/modules/delivery-person.module';
import { DeliveryModule } from './infrastructure/modules/delivery.module';

@Module({
  imports: [
    DeliveryPersonModule,
    DeliveryModule,
  ],
})
export class AppModule {}
