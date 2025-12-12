import { Injectable, Logger } from '@nestjs/common';
import { INotification, NotificationInfo } from '../../domain/notifications/notification.interface';
import { NotificationFactory } from '../../domain/notifications/notification.factory';

/**
 * Produto Concreto - SMS Notification
 */
class SmsNotification implements INotification {
  private readonly logger = new Logger('SmsNotification');

  constructor(
    private readonly recipient: string,
    private readonly message: string,
    private readonly deliveryId: string,
    private readonly orderId: string
  ) {}

  async send(): Promise<void> {
    // Simulação de envio de SMS
    // Em produção, integraria com serviço de SMS (Twilio, AWS SNS, etc)
    this.logger.log(`Enviando SMS para ${this.recipient}`);
    
    // Trunca mensagem para limite de SMS (160 caracteres)
    const truncatedMessage = this.message.length > 160 
      ? this.message.substring(0, 157) + '...'
      : this.message;
    
    this.logger.log(`Mensagem: ${truncatedMessage}`);
    
    // Simula delay de envio
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.logger.log(`SMS enviado com sucesso para ${this.recipient}`);
  }

  getInfo(): NotificationInfo {
    return {
      type: 'sms',
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
 * Factory concreta que cria notificações por SMS.
 * Implementa o factory method para retornar SmsNotification.
 */
@Injectable()
export class SmsNotificationFactory extends NotificationFactory {
  protected createNotification(
    recipient: string,
    message: string,
    deliveryId: string,
    orderId: string
  ): INotification {
    // Factory Method: cria e retorna SmsNotification
    return new SmsNotification(recipient, message, deliveryId, orderId);
  }
}
