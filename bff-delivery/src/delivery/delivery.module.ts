import { Module, forwardRef } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { DeliveryResolver } from './delivery.resolver';
import { AsyncDeliveryResolver } from './async-delivery.resolver';
import { DeliveryFieldResolver } from './delivery-field.resolver';
import { DeliveryServiceImpl } from './delivery.service';
import { DataLoadersModule } from '../dataloaders/dataloaders.module';

@Module({
  imports: [
    ClientsModule.register([
      {
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
      },
    ]),
    forwardRef(() => DataLoadersModule),
  ],
  providers: [
    DeliveryResolver,
    AsyncDeliveryResolver,
    DeliveryFieldResolver,
    DeliveryServiceImpl,
    { provide: 'DeliveryService', useExisting: DeliveryServiceImpl },
  ],
  exports: ['DeliveryService', DeliveryServiceImpl],
})
export class DeliveryModule {}
