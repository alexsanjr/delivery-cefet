import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { SendNotificationUseCase } from './use-cases/send-notification.use-case';
import { GetNotificationsUseCase } from './use-cases/get-notifications.use-case';
import { MarkNotificationAsReadUseCase } from './use-cases/mark-notification-read.use-case';
import { ManageClientConnectionUseCase } from './use-cases/manage-client-connection.use-case';
import { NotificationApplicationService } from './services/notification-application.service';
import { RedisNotificationRepository } from '../infrastructure/redis-notification.repository';
import { RabbitMQService } from '../infrastructure/rabbitmq.service';
import { RabbitMQConsumerService } from '../infrastructure/rabbitmq-consumer.service';
import { TerminalNotifierObserver, NotificationLoggerObserver, NotificationSubjectAdapter } from '../infrastructure/adapters';
import { OrderEventsAdapter } from '../infrastructure/adapters/order-events.adapter';

@Module({
    imports: [
        RedisModule.forRoot({
            type: 'single',
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        }),
    ],
    providers: [
        TerminalNotifierObserver,
        NotificationLoggerObserver,
        RabbitMQService,
        NotificationSubjectAdapter,
        OrderEventsAdapter,
        RedisNotificationRepository,
        RabbitMQConsumerService,
        { provide: 'NotificationRepositoryPort', useExisting: RedisNotificationRepository },
        { provide: 'NotificationSubjectPort', useExisting: NotificationSubjectAdapter },
        { provide: 'MessagingPort', useExisting: RabbitMQService },
        { provide: 'ClientConnectionPort', useExisting: TerminalNotifierObserver },
        SendNotificationUseCase,
        GetNotificationsUseCase,
        MarkNotificationAsReadUseCase,
        ManageClientConnectionUseCase,
        NotificationApplicationService,
    ],
    exports: [
        SendNotificationUseCase,
        GetNotificationsUseCase,
        MarkNotificationAsReadUseCase,
        ManageClientConnectionUseCase,
        NotificationApplicationService,
    ],
})
export class NotificationsApplicationModule {}