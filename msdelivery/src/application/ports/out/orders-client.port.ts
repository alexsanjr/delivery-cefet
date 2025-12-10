export interface OrderAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

export interface OrderData {
  id: number;
  customerId: number;
  customerName: string;
  deliveryAddress: OrderAddress;
  status: string;
  totalAmount: number;
}

export interface IOrdersClient {
  getOrder(orderId: number): Promise<OrderData | null>;
}

export const ORDERS_CLIENT = Symbol('IOrdersClient');
