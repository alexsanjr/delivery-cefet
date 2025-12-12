import { Injectable, Logger } from '@nestjs/common';
import { SendNotificationUseCase } from '../../application/use-cases/send-notification.use-case';
import { CreateNotificationDto } from '../../application/dtos/notifications-create.dto';

@Injectable()
export class OrderEventsAdapter {
    private readonly logger = new Logger(OrderEventsAdapter.name);

    constructor(
        private readonly sendNotificationUseCase: SendNotificationUseCase,
    ) {}

    async handleOrderCreated(event: any): Promise<void> {
        try {
            this.logger.log(`Processing OrderCreated event for order ${event.orderId}`);
        } catch (error) {
            this.logger.error(`Failed to process OrderCreated event: ${error.message}`);
        }
    }

    async handleOrderStatusChanged(event: any): Promise<void> {
        try {
            this.logger.log(
                `Processing OrderStatusChanged event for order ${event.orderId}: ${event.previousStatus} → ${event.newStatus}`
            );

            const message = this.getStatusMessage(event.orderId, event.newStatus);
            
            const dto: CreateNotificationDto = {
                userId: event.customerId?.toString() || `customer-${event.orderId}`,
                orderId: event.orderId.toString(),
                status: event.newStatus,
                serviceOrigin: 'orders',
                message: message,
            };
            
            await this.sendNotificationUseCase.execute(dto);
            
            this.logger.log(`Notification sent for order ${event.orderId} status change`);
        } catch (error) {
            this.logger.error(`Failed to process OrderStatusChanged event: ${error.message}`);
        }
    }

    async handleOrderCancelled(event: any): Promise<void> {
        try {
            this.logger.log(`Processing OrderCancelled event for order ${event.orderId}`);
            
            const dto: CreateNotificationDto = {
                userId: event.customerId?.toString() || `customer-${event.orderId}`,
                orderId: event.orderId.toString(),
                status: 'CANCELLED',
                serviceOrigin: 'orders',
                message: `Pedido #${event.orderId} foi cancelado. Motivo: ${event.reason}`,
            };
            
            await this.sendNotificationUseCase.execute(dto);
        } catch (error) {
            this.logger.error(`Failed to process OrderCancelled event: ${error.message}`);
        }
    }

    private getStatusMessage(orderId: number, status: string): string {
        const messages: Record<string, string> = {
            'PENDING': `Pedido #${orderId} aguardando confirmação.`,
            'CONFIRMED': `Pedido confirmado! Aguardando preparo.`,
            'PREPARING': `Pedido #${orderId} está sendo preparado na cozinha.`,
            'OUT_FOR_DELIVERY': `Pedido #${orderId} saiu para entrega!`,
            'ARRIVING': `Pedido #${orderId} está chegando!`,
            'DELIVERED': `Pedido #${orderId} foi entregue com sucesso!`,
            'CANCELLED': `Pedido #${orderId} foi cancelado.`,
        };

        return messages[status] || `Status do pedido #${orderId}: ${status}`;
    }
}
