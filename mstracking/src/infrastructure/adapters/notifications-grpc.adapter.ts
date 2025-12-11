import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { NotificationServicePort } from '../../domain/ports/external-services.port';

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
export class NotificationsGrpcAdapter implements NotificationServicePort, OnModuleInit {
  private notificationsService: INotificationsService;

  constructor(@Inject('NOTIFICATIONS_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.notificationsService = this.client.getService<INotificationsService>('NotificationsService');
  }

  async notifyOrderConfirmed(userId: string, orderId: string): Promise<void> {
    await this.sendNotification(
      userId,
      orderId,
      'CONFIRMED',
      'Pedido confirmado! Rastreamento iniciado.'
    );
  }

  async notifyOutForDelivery(userId: string, orderId: string): Promise<void> {
    await this.sendNotification(
      userId,
      orderId,
      'OUT_FOR_DELIVERY',
      'Saiu para entrega! Seu pedido está a caminho.'
    );
  }

  async notifyDelivered(userId: string, orderId: string): Promise<void> {
    await this.sendNotification(
      userId,
      orderId,
      'DELIVERED',
      'Entregue! Seu pedido foi entregue com sucesso.'
    );
  }

  private async sendNotification(
    userId: string,
    orderId: string,
    status: string,
    message: string
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.notificationsService.SendNotification({
          userId,
          orderId,
          status,
          serviceOrigin: 'mstracking',
          message,
        })
      );
    } catch (error) {
      console.error(`Failed to send notification for order ${orderId}:`, error);
    }
  }
}
