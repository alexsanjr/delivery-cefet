import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { NotificationApplicationService } from '../../application/services/notification-application.service';

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
    constructor(private readonly notificationApplicationService: NotificationApplicationService) {}

    @GrpcMethod('NotificationsService', 'SendNotification')
    async sendNotification(data: NotificationRequest): Promise<NotificationResponse> {
        try {
            const notification = await this.notificationApplicationService.sendNotification(
                data.userId,
                data.orderId,
                data.status,
                data.serviceOrigin,
                data.message,
            );

            const primitives = notification.toPrimitives();

            return {
                id: primitives.id,
                userId: primitives.userId,
                orderId: primitives.orderId,
                status: primitives.status,
                message: primitives.message,
                serviceOrigin: primitives.serviceOrigin,
                success: true,
            };
        } catch (error) {
            throw new Error(`Falhou em enviar notificação: ${error.message}`);
        }
    }

    @GrpcMethod('NotificationsService', 'ConnectClient')
    async connectClient(data: ConnectClientRequest): Promise<ConnectClientResponse> {
        try {
            this.notificationApplicationService.connectClient(data.userId);
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
            this.notificationApplicationService.disconnectClient(data.userId);
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
