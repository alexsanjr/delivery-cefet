import { Injectable, Logger } from '@nestjs/common';
import { INotificationSender } from '../../application/ports/notification-sender.port';

@Injectable()
export class NotificationAdapter implements INotificationSender {
  private readonly logger = new Logger(NotificationAdapter.name);

  async sendOrderCreatedNotification(
    orderId: number,
    customerId: number,
  ): Promise<void> {
    this.logger.log(
      `Sending order created notification: orderId=${orderId}, customerId=${customerId}`,
    );

    // TODO: Implementar integração com msnotifications via gRPC ou RabbitMQ
    // Por enquanto apenas logamos
  }

  async sendOrderStatusChangedNotification(
    orderId: number,
    status: string,
  ): Promise<void> {
    this.logger.log(
      `Sending order status changed notification: orderId=${orderId}, status=${status}`,
    );

    // TODO: Implementar integração com msnotifications
  }

  async sendOrderCancelledNotification(orderId: number): Promise<void> {
    this.logger.log(`Sending order cancelled notification: orderId=${orderId}`);

    // TODO: Implementar integração com msnotifications
  }
}
