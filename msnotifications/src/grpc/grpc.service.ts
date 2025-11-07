import { Controller } from '@nestjs/common';
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

@Controller()
export class GrpcNotificationsService {
    constructor(private readonly notificationsService: NotificationsService) {}

    @GrpcMethod('NotificationsService', 'SendNotification')
    async sendNotification(data: NotificationRequest): Promise<NotificationResponse> {
        try {
            const createDto: CreateNotificationDto = {
                userId: data.userId,
                orderId: data.orderId,
                status: data.status,
                serviceOrigin: data.serviceOrigin,
                message: data.message,
            };

            const notification = await this.notificationsService.createNotification(createDto);

            return {
                id: notification.id,
                userId: notification.userId,
                orderId: notification.orderId,
                status: notification.status,
                message: notification.message,
                serviceOrigin: notification.serviceOrigin,
                success: true,
            };
        } catch (error) {
            throw new Error(`Falhou em enviar notificação: ${error.message}`);
        }
    }

    @GrpcMethod('NotificationsService', 'ConnectClient')
    async connectClient(data: ConnectClientRequest): Promise<ConnectClientResponse> {
        try {
            this.notificationsService.connectClient(data.userId);
            return {
                success: true,
                message: `Cliente ${data.userId} conectado com sucesso`,
            };
        } catch (error) {
            return {
                success: false,
                message: `Erro ao conectar cliente: ${error.message}`,
            };
        }
    }

    @GrpcMethod('NotificationsService', 'DisconnectClient')
    async disconnectClient(data: DisconnectClientRequest): Promise<DisconnectClientResponse> {
        try {
            this.notificationsService.disconnectClient(data.userId);
            return {
                success: true,
                message: `Cliente ${data.userId} desconectado com sucesso`,
            };
        } catch (error) {
            return {
                success: false,
                message: `Erro ao desconectar cliente: ${error.message}`,
            };
        }
    }
}
