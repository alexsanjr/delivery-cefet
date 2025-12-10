export interface INotificationSender {
  sendOrderCreatedNotification(
    orderId: number,
    customerId: number,
  ): Promise<void>;
  sendOrderStatusChangedNotification(
    orderId: number,
    status: string,
  ): Promise<void>;
  sendOrderCancelledNotification(orderId: number): Promise<void>;
}

export const NOTIFICATION_SENDER = Symbol('INotificationSender');
