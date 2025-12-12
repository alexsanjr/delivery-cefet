import { Module, Scope, forwardRef } from '@nestjs/common';
import { DeliveryPersonLoader } from './delivery-person.loader';
import { DeliveryServiceImpl } from '../delivery/delivery.service';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [forwardRef(() => DeliveryModule)],
  providers: [
    {
      provide: DeliveryPersonLoader,
      useFactory: (deliveryService: DeliveryServiceImpl) => {
        return new DeliveryPersonLoader(deliveryService);
      },
      inject: ['DeliveryService'],
      scope: Scope.REQUEST,
    },
  ],
  exports: [DeliveryPersonLoader],
})
export class DataLoadersModule {}
