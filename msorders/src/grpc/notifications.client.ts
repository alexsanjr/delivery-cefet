import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';

interface NotificationRequest {
  userId: string;
  orderId: string;
  status: string;
  serviceOrigin: string;
  message?: string;
}

interface NotificationResponse {
  id: string;
  success: boolean;
  message: string;
}

interface ConnectClientRequest {
  userId: string;
}

interface ConnectClientResponse {
  success: boolean;
  message: string;
}

interface NotificationsService {
  SendNotification(data: NotificationRequest): Observable<NotificationResponse>;
  ConnectClient(data: ConnectClientRequest): Observable<ConnectClientResponse>;
}

@Injectable()
export class NotificationsClient implements OnModuleInit {
  private notificationsService: NotificationsService;

  constructor(@Inject('NOTIFICATIONS_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.notificationsService = this.client.getService<NotificationsService>(
      'NotificationsService',
    );
  }

  sendNotification(
    userId: string,
    orderId: string,
    status: string,
    message?: string,
  ) {
    return this.notificationsService.SendNotification({
      userId,
      orderId,
      status,
      serviceOrigin: 'msorders',
      message,
    });
  }

  connectClient(userId: string) {
    return this.notificationsService.ConnectClient({
      userId,
    });
  }
}
