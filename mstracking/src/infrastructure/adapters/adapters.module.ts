import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NotificationsGrpcAdapter } from './notifications-grpc.adapter';
import { OrdersGrpcAdapter } from './orders-grpc.adapter';
import { RoutingGrpcAdapter } from './routing-grpc.adapter';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'NOTIFICATIONS_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'notifications',
                    protoPath: join(process.cwd(), 'proto/notifications.proto'),
                    url: process.env.NOTIFICATIONS_GRPC_URL || 'msnotifications:50053',
                },
            },
            {
                name: 'ORDERS_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'orders',
                    protoPath: join(process.cwd(), 'proto/orders.proto'),
                    url: process.env.ORDERS_GRPC_URL || 'msorders:50052',
                },
            },
            {
                name: 'ROUTING_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'routing.v1',
                    protoPath: join(process.cwd(), 'proto/routing.proto'),
                    url: process.env.ROUTING_GRPC_URL || 'msrouting:50054',
                },
            },
        ]),
    ],
    providers: [
        NotificationsGrpcAdapter,
        OrdersGrpcAdapter,
        RoutingGrpcAdapter,
    ],
    exports: [
        NotificationsGrpcAdapter,
        OrdersGrpcAdapter,
        RoutingGrpcAdapter,
    ],
})
export class AdaptersModule {}
