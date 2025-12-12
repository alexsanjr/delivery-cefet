import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { PositionLoggerObserver } from '../infrastructure/adapters/position-logger.observer';
<<<<<<< HEAD
import { PositionSubjectAdapter } from '../infrastructure/adapters/position-subject.adapter';
import { AdaptersModule } from '../infrastructure/adapters/adapters.module';
=======
import { EmailNotificationFactory } from '../infrastructure/notifications/email-notification.factory';
import { SmsNotificationFactory } from '../infrastructure/notifications/sms-notification.factory';
>>>>>>> 2ae6e1968ab7acb46a5cec6272d92945823535bc

@Module({
    imports: [
        TypeOrmModule.forFeature([TrackingPositionORM, DeliveryTrackingORM]),
        AdaptersModule,
    ],
    providers: [
        PositionLoggerObserver,
        PositionSubjectAdapter,
        TypeORMTrackingRepository,
        TypeORMDeliveryTrackingRepository,
        RabbitMQService,
        RabbitMQConsumerService,
        { provide: 'TrackingRepositoryPort', useExisting: TypeORMTrackingRepository },
        { provide: 'DeliveryTrackingRepositoryPort', useExisting: TypeORMDeliveryTrackingRepository },
        { provide: 'PositionSubjectPort', useExisting: PositionSubjectAdapter },
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
