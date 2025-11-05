import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { CustomersClient } from './customers.client';
import { NotificationsClient } from './notifications.client';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CUSTOMERS_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'customers',
          protoPath: join(__dirname, 'customers.proto'),
          url: process.env.CUSTOMERS_GRPC_URL || 'localhost:50051',
        },
      },
      {
        name: 'NOTIFICATIONS_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'notifications',
          protoPath: join(__dirname, 'notifications.proto'),
          url: process.env.NOTIFICATIONS_GRPC_URL || 'localhost:50053',
        },
      },
    ]),
  ],
  providers: [CustomersClient, NotificationsClient],
  exports: [CustomersClient, NotificationsClient],
})
export class GrpcModule {}
