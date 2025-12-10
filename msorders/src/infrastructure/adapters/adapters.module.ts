import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { CUSTOMER_VALIDATOR } from '../../application/ports/customer-validator.port';
import { NOTIFICATION_SENDER } from '../../application/ports/notification-sender.port';
import { ROUTING_CALCULATOR } from '../../application/ports/routing-calculator.port';

import { CustomersGrpcAdapter } from './customers-grpc.adapter';
import { NotificationAdapter } from './notification.adapter';
import { RoutingAdapter } from './routing.adapter';
import { CustomersClient } from '../../grpc/customers.client';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CUSTOMERS_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'customers',
          protoPath: join(__dirname, '../../../src/grpc/customers.proto'),
          url: process.env.CUSTOMERS_GRPC_URL || 'localhost:50051',
        },
      },
    ]),
  ],
  providers: [
    CustomersClient,
    {
      provide: CUSTOMER_VALIDATOR,
      useClass: CustomersGrpcAdapter,
    },
    {
      provide: NOTIFICATION_SENDER,
      useClass: NotificationAdapter,
    },
    {
      provide: ROUTING_CALCULATOR,
      useClass: RoutingAdapter,
    },
  ],
  exports: [CUSTOMER_VALIDATOR, NOTIFICATION_SENDER, ROUTING_CALCULATOR],
})
export class AdaptersModule {}
