import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NotificationsClient } from './notifications.client';
import { OrdersClient } from './orders.client';

@Module({
    imports: [
        ClientsModule.register([
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
        ClientsModule.register([
            {
                name: 'ORDERS_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'orders',
                    protoPath: join(__dirname, 'orders.proto'),
                    url: process.env.ORDERS_GRPC_URL || 'localhost:50052',
                },
            },
        ]),
    ],
    providers: [NotificationsClient, OrdersClient],
    exports: [NotificationsClient, OrdersClient],
})
export class GrpcModule { }
