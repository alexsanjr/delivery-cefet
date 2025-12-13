import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { SendNotificationUseCase } from './use-cases/send-notification.use-case';
import { GetNotificationsUseCase } from './use-cases/get-notifications.use-case';
import { MarkNotificationAsReadUseCase } from './use-cases/mark-notification-read.use-case';
import { ManageClientConnectionUseCase } from './use-cases/manage-client-connection.use-case';
import { NotificationApplicationService } from './services/notification-application.service';
import { RedisNotificationRepository } from '../infrastructure/persistence/redis-notification.repository';
import { RabbitMQService } from '../infrastructure/messaging/rabbitmq.service';
import { RabbitMQConsumerService } from '../infrastructure/messaging/rabbitmq-consumer.service';
import { TerminalNotifierObserver } from '../infrastructure/observers/terminal-notifier.observer';
import { NotificationLoggerObserver } from '../infrastructure/observers/notification-logger.observer';
import { NotificationSubjectAdapter } from '../infrastructure/observers/notification-subject.adapter';
import { OrderEventsHandler } from '../presentation/messaging/order-events.handler';

@Module({
    imports: [
        RedisModule.forRoot({
            type: 'single',
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        }),
    ],
    providers: [
        // Infrastructure - Observers
        TerminalNotifierObserver,
        NotificationLoggerObserver,
        NotificationSubjectAdapter,
        
        // Infrastructure - Messaging
        RabbitMQService,
        RabbitMQConsumerService,
        
        // Infrastructure - Persistence
        RedisNotificationRepository,
        
        // Presentation - Messaging Handlers
        OrderEventsHandler,
        
        // Ports bindings
        { provide: 'NotificationRepositoryPort', useExisting: RedisNotificationRepository },
        { provide: 'NotificationSubjectPort', useExisting: NotificationSubjectAdapter },
        { provide: 'MessagingPort', useExisting: RabbitMQService },
        { provide: 'ClientConnectionPort', useExisting: TerminalNotifierObserver },
        
        // Application - Use Cases
        SendNotificationUseCase,
        GetNotificationsUseCase,
        MarkNotificationAsReadUseCase,
        ManageClientConnectionUseCase,
        
        // Application - Service
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