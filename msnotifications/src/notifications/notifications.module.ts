import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { TerminalNotifierObserver, NotificationLoggerObserver } from './observers';

@Module({
    providers: [
        NotificationsService,
        NotificationsRepository,
        TerminalNotifierObserver,
        NotificationLoggerObserver,
    ],
    exports: [NotificationsService],
})
export class NotificationsModule {}