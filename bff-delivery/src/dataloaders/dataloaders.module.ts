import { Module, Scope } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { DeliveryPersonLoader } from './delivery-person.loader';
import { DeliveryServiceImpl } from '../delivery/delivery.service';

@Module({
  imports: [
    ClientsModule.register([{
      name: 'DELIVERY_PACKAGE',
      transport: Transport.GRPC,
      options: {
        package: ['deliveryperson', 'delivery'],
        protoPath: [
          join(__dirname, '../../proto/delivery-person.proto'),
          join(__dirname, '../../proto/delivery.proto'),
        ],
        url: process.env.DELIVERY_GRPC_URL || 'msdelivery:50056',
      },
    }]),
  ],
  providers: [
    DeliveryServiceImpl,
    {
      provide: DeliveryPersonLoader,
      useFactory: (deliveryService: DeliveryServiceImpl) => {
        return new DeliveryPersonLoader(deliveryService);
      },
      inject: [DeliveryServiceImpl],
      scope: Scope.REQUEST,
    },
  ],
  exports: [DeliveryPersonLoader],
})
export class DataLoadersModule {}
