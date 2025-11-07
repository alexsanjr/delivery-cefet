import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { CustomersClient } from './customers.client';
import { RoutingClient } from './routing.client';
import { NotificationsClient } from './notifications.client';
import { TrackingClient } from './tracking.client';

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
        name: 'ROUTING_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'routing.v1',
          protoPath: join(__dirname, 'routing.proto'),
          url: process.env.ROUTING_GRPC_URL || 'localhost:50054',
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
      {
        name: 'TRACKING_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'tracking',
          protoPath: join(__dirname, 'tracking.proto'),
          url: process.env.TRACKING_GRPC_URL || 'localhost:50055',
        },
      },
    ]),
  ],
  providers: [
    CustomersClient,
    RoutingClient,
    NotificationsClient,
    TrackingClient,
  ],
  exports: [
    CustomersClient,
    RoutingClient,
    NotificationsClient,
    TrackingClient,
  ],
})
export class GrpcModule {}
