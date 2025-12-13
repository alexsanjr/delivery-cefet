import { Injectable, Logger } from '@nestjs/common';
import type { NotificationObserverPort } from '../../domain/ports/notification-observer.port';
import type { NotificationData } from '../../domain/notification-data.interface';

@Injectable()
export class NotificationLoggerObserver implements NotificationObserverPort {
    private readonly logger = new Logger(NotificationLoggerObserver.name);
    
    async update(notification: NotificationData): Promise<void> {
        this.logger.log(
            `Notificação - Pedido: ${notification.orderId}, ` +
            `Usuário: ${notification.userId}, ` +
            `Status: ${notification.status}, ` +
            `Origem: ${notification.serviceOrigin}`
        );
    }
}
