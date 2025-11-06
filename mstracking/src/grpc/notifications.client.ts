import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';

interface NotificationRequest {
    userId: string;
    orderId: string;
    status: string;
    serviceOrigin: string;
    message?: string;
    additionalInfo?: string;
}

interface NotificationResponse {
    id: string;
    userId: string;
    orderId: string;
    status: string;
    message: string;
    serviceOrigin: string;
    success: boolean;
}

interface INotificationsService {
    SendNotification(data: NotificationRequest): Observable<NotificationResponse>;
}

@Injectable()
export class NotificationsClient implements OnModuleInit {
    private readonly logger = new Logger(NotificationsClient.name);
    private notificationsService: INotificationsService;

    constructor(
        @Inject('NOTIFICATIONS_PACKAGE') private readonly client: ClientGrpc,
    ) { }

    onModuleInit() {
        this.notificationsService = this.client.getService<INotificationsService>(
            'NotificationsService',
        );
        this.logger.log('NotificationsClient initialized');
    }

    async sendNotification(
        userId: string,
        orderId: string,
        status: string,
        message?: string,
    ): Promise<NotificationResponse> {
        try {
            const response = await firstValueFrom(
                this.notificationsService.SendNotification({
                    userId,
                    orderId,
                    status,
                    serviceOrigin: 'mstracking',
                    message,
                }),
            );

            this.logger.log(
                `Notification sent: userId=${userId}, orderId=${orderId}, status=${status}`,
            );

            return response;
        } catch (error) {
            this.logger.error(
                `Failed to send notification: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }

    async notifyOrderConfirmed(userId: string, orderId: string): Promise<NotificationResponse> {
        return this.sendNotification(
            userId,
            orderId,
            'CONFIRMED',
            'Pedido confirmado! Estamos preparando sua entrega.',
        );
    }

    async notifyOutForDelivery(userId: string, orderId: string): Promise<NotificationResponse> {
        return this.sendNotification(
            userId,
            orderId,
            'OUT_FOR_DELIVERY',
            'Saiu para entrega! Seu pedido está a caminho.',
        );
    }

    async notifyArrivingSoon(userId: string, orderId: string): Promise<NotificationResponse> {
        return this.sendNotification(
            userId,
            orderId,
            'ARRIVING_SOON',
            'Chegando em 5 minutos! Prepare-se para receber.',
        );
    }

    async notifyDelivered(userId: string, orderId: string): Promise<NotificationResponse> {
        return this.sendNotification(
            userId,
            orderId,
            'DELIVERED',
            'Pedido entregue com sucesso!',
        );
    }
}
