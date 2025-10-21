import { Injectable } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateNotificationDto } from '../notifications/dto/notifications-create.dto';

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

interface ConnectClientRequest {
    userId: string;
}

interface ConnectClientResponse {
    success: boolean;
    message: string;
}

interface DisconnectClientRequest {
    userId: string;
}

interface DisconnectClientResponse {
    success: boolean;
    message: string;
}

@Injectable()
export class GrpcNotificationsService {
    constructor(private readonly notificationsService: NotificationsService) {}

    @GrpcMethod('NotificationsService', 'SendNotification')
    async sendNotification(data: NotificationRequest): Promise<NotificationResponse> {
        //todo
    }

    @GrpcMethod('NotificationsService', 'ConnectClient')
    async connectClient(data: ConnectClientRequest): Promise<ConnectClientResponse> {
        //todo
    }

    @GrpcMethod('NotificationsService', 'DisconnectClient')
    async disconnectClient(data: DisconnectClientRequest): Promise<DisconnectClientResponse> {
        //todo
    }
}
