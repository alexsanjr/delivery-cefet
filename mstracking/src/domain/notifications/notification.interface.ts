/**
 * Factory Method Pattern (GoF)
 * 
 * Interface para notificações que serão criadas pelas factories.
 * Produto abstrato do padrão Factory Method.
 */
export interface INotification {
  /**
   * Envia a notificação para o destinatário
   */
  send(): Promise<void>;

  /**
   * Obtém informações sobre a notificação
   */
  getInfo(): NotificationInfo;
}

export interface NotificationInfo {
  type: 'email' | 'sms';
  recipient: string;
  message: string;
  deliveryId: string;
  orderId: string;
}
