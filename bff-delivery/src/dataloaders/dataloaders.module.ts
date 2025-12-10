import { Module, Scope } from '@nestjs/common';
import { DeliveryPersonLoader } from './delivery-person.loader';
import { DeliveryServiceImpl } from '../delivery/delivery.service';

@Module({
  providers: [
    {
      provide: DeliveryPersonLoader,
      useFactory: (deliveryService: DeliveryServiceImpl) => {
        return new DeliveryPersonLoader(deliveryService);
      },
      inject: ['DeliveryService'],
      scope: Scope.REQUEST, // Nova instância por request - evita cache entre usuários
    },
  ],
  exports: [DeliveryPersonLoader],
})
export class DataLoadersModule {}
