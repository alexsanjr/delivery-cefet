import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { DeliveryResolver } from './delivery.resolver';
import { DeliveryServiceImpl } from './delivery.service';

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
  ],
  providers: [
    DeliveryResolver, 
    { provide: 'DeliveryService', useClass: DeliveryServiceImpl },
  ],
})
export class DeliveryModule {}
