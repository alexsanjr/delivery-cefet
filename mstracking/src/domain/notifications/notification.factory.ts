import { INotification, NotificationInfo } from './notification.interface';

/**
 * Factory Method Pattern (GoF) - Produto Abstrato
 * 
 * Define o factory method abstrato que as subclasses devem implementar
 * para criar diferentes tipos de notificações.
 * 
 * Benefícios:
 * - Encapsulamento da lógica de criação
 * - Open/Closed Principle: Fácil adicionar novos tipos de notificação
 * - Single Responsibility: Cada factory cria um tipo específico
 * - Desacoplamento: Cliente usa a interface abstrata
 */
export abstract class NotificationFactory {
  /**
   * Factory Method - Método abstrato que subclasses devem implementar
   * para criar instâncias concretas de notificações
   */
  protected abstract createNotification(
    recipient: string,
    message: string,
    deliveryId: string,
    orderId: string
  ): INotification;

  /**
   * Template Method - Define o fluxo geral de envio de notificação
   * Usa o factory method para criar a notificação e então enviá-la
   */
  async sendNotification(
    recipient: string,
    message: string,
    deliveryId: string,
    orderId: string
  ): Promise<void> {
    // Usa o factory method para criar a notificação apropriada
    const notification = this.createNotification(
      recipient,
      message,
      deliveryId,
      orderId
    );

    // Envia a notificação
    await notification.send();

    // Log da notificação enviada
    const info = notification.getInfo();
    console.log(
      `[${info.type.toUpperCase()}] Notificação enviada para ${info.recipient} - Delivery: ${info.deliveryId}`
    );
  }
}
