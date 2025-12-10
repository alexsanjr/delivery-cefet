// Events para RabbitMQ com Protobuf

export interface OrderCreatedMessageData {
  orderId: number;
  customerId: number;
  total: number;
  status: string;
  paymentMethod: string;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: string;
}

export interface OrderStatusChangedMessageData {
  orderId: number;
  customerId: number;
  previousStatus: string;
  newStatus: string;
  changedAt: string;
}

export interface OrderCancelledMessageData {
  orderId: number;
  customerId: number;
  reason?: string;
  cancelledAt: string;
}

export interface NotificationMessageData {
  userId: string;
  orderId: string;
  type: string;
  message: string;
  timestamp: string;
}
