import { Injectable, Logger } from '@nestjs/common';
import { INotificationObserver, NotificationData } from '../interfaces';

@Injectable()
export class NotificationLoggerObserver implements INotificationObserver {
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
