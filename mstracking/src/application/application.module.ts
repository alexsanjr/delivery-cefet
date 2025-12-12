import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { StartTrackingUseCase } from './use-cases/start-tracking.use-case';
import { UpdatePositionUseCase } from './use-cases/update-position.use-case';
import { GetTrackingDataUseCase } from './use-cases/get-tracking-data.use-case';
import { GetActiveDeliveriesUseCase } from './use-cases/get-active-deliveries.use-case';
import { MarkAsDeliveredUseCase } from './use-cases/mark-as-delivered.use-case';
import { TrackingApplicationService } from './services/tracking-application.service';
import { TypeORMTrackingRepository } from '../infrastructure/persistence/typeorm-tracking.repository';
import { TypeORMDeliveryTrackingRepository } from '../infrastructure/persistence/typeorm-delivery-tracking.repository';
import { TrackingPositionORM } from '../infrastructure/persistence/tracking-position.orm';
import { DeliveryTrackingORM } from '../infrastructure/persistence/delivery-tracking.orm';
import { RabbitMQService } from '../infrastructure/rabbitmq.service';
import { RabbitMQConsumerService } from '../infrastructure/rabbitmq-consumer.service';
import { OrdersGrpcAdapter } from '../infrastructure/adapters/orders-grpc.adapter';
import { NotificationsGrpcAdapter } from '../infrastructure/adapters/notifications-grpc.adapter';
import { RoutingGrpcAdapter } from '../infrastructure/adapters/routing-grpc.adapter';
import { PositionSubjectAdapter } from '../infrastructure/adapters/position-subject.adapter';
import { PositionLoggerObserver } from '../infrastructure/adapters/position-logger.observer';
import { EmailNotificationFactory } from '../infrastructure/notifications/email-notification.factory';
import { SmsNotificationFactory } from '../infrastructure/notifications/sms-notification.factory';

@Module({
    imports: [
        TypeOrmModule.forFeature([TrackingPositionORM, DeliveryTrackingORM]),
        ClientsModule.register([
            {
                name: 'ORDERS_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'orders',
                    protoPath: join(__dirname, '../grpc/orders.proto'),
                    url: process.env.ORDERS_GRPC_URL || 'localhost:50052',
                },
            },
            {
                name: 'NOTIFICATIONS_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'notifications',
                    protoPath: join(__dirname, '../presentation/grpc/notifications.proto'),
                    url: process.env.NOTIFICATIONS_GRPC_URL || 'localhost:50053',
                },
            },
            {
                name: 'ROUTING_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'routing.v1',
                    protoPath: join(__dirname, '../grpc/routing.proto'),
                    url: process.env.ROUTING_GRPC_URL || 'localhost:50054',
                },
            },
        ]),
    ],
    providers: [
        StartTrackingUseCase,
        UpdatePositionUseCase,
        GetTrackingDataUseCase,
        GetActiveDeliveriesUseCase,
        MarkAsDeliveredUseCase,
        TrackingApplicationService,
        TypeORMTrackingRepository,
        TypeORMDeliveryTrackingRepository,
        RabbitMQService,
        RabbitMQConsumerService,
        OrdersGrpcAdapter,
        NotificationsGrpcAdapter,
        RoutingGrpcAdapter,
        PositionSubjectAdapter,
        PositionLoggerObserver,
        // Factory Method Pattern: Registra as factories de notificação
        {
            provide: 'EMAIL_NOTIFICATION_FACTORY',
            useClass: EmailNotificationFactory,
        },
        {
            provide: 'SMS_NOTIFICATION_FACTORY',
            useClass: SmsNotificationFactory,
        },
    ],
    exports: [
        StartTrackingUseCase,
        UpdatePositionUseCase,
        GetTrackingDataUseCase,
        GetActiveDeliveriesUseCase,
        MarkAsDeliveredUseCase,
        TrackingApplicationService,
    ],
})
export class TrackingApplicationModule {}
