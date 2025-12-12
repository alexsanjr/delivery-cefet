import { Injectable, Logger } from '@nestjs/common';
import { INotification, NotificationInfo } from '../../domain/notifications/notification.interface';
import { NotificationFactory } from '../../domain/notifications/notification.factory';

/**
 * Produto Concreto - Email Notification
 */
class EmailNotification implements INotification {
  private readonly logger = new Logger('EmailNotification');

  constructor(
    private readonly recipient: string,
    private readonly message: string,
    private readonly deliveryId: string,
    private readonly orderId: string
  ) {}

  async send(): Promise<void> {
    // Simulação de envio de email
    // Em produção, integraria com serviço de email (SendGrid, AWS SES, etc)
    this.logger.log(`Enviando email para ${this.recipient}`);
    this.logger.log(`Assunto: Atualização de Entrega #${this.deliveryId}`);
    this.logger.log(`Mensagem: ${this.message}`);
    
    // Simula delay de envio
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.logger.log(`Email enviado com sucesso para ${this.recipient}`);
  }

  getInfo(): NotificationInfo {
    return {
      type: 'email',
      recipient: this.recipient,
      message: this.message,
      deliveryId: this.deliveryId,
      orderId: this.orderId,
    };
  }
}

/**
 * Factory Method Pattern (GoF) - Concrete Creator
 * 
 * Factory concreta que cria notificações por email.
 * Implementa o factory method para retornar EmailNotification.
 */
@Injectable()
export class EmailNotificationFactory extends NotificationFactory {
  protected createNotification(
    recipient: string,
    message: string,
    deliveryId: string,
    orderId: string
  ): INotification {
    // Factory Method: cria e retorna EmailNotification
    return new EmailNotification(recipient, message, deliveryId, orderId);
  }
}
