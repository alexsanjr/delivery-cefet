import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NotificationsClient } from './notifications.client';
import { OrdersClient } from './orders.client';
import { RoutingClient } from './routing.client';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NOTIFICATIONS_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'notifications',
          protoPath: join(__dirname, './notifications.proto'),
          url: process.env.NOTIFICATIONS_GRPC_URL || 'localhost:50053',
        },
      },
    ]),
    ClientsModule.register([
      {
        name: 'ORDERS_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'orders',
          protoPath: join(__dirname, './orders.proto'),
          url: process.env.ORDERS_GRPC_URL || 'localhost:50052',
        },
      },
    ]),
    ClientsModule.register([
      {
        name: 'ROUTING_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'routing.v1',
          protoPath: join(__dirname, './routing.proto'),
          url: process.env.ROUTING_GRPC_URL || 'localhost:50054',
        },
      },
    ]),
  ],
  providers: [NotificationsClient, OrdersClient, RoutingClient],
  exports: [NotificationsClient, OrdersClient, RoutingClient],
})
export class GrpcModule {}
