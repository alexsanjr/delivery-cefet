export interface IOrderResponseMapper {
  mapOrderToResponse(order: any, customerData: any): OrderResponse;
  mapOrderItemToResponse(item: any): OrderItemResponse;
  mapAddressToResponse(address: any): DeliveryAddressResponse;
}

export interface ICustomerDataEnricher {
  enrichWithCustomerData(customerId: number): Promise<CustomerData>;
  getPrimaryAddress(addresses: any[]): any;
}

export interface IOrderRepository {
  findById(id: number): Promise<any>;
  findByCustomerId(customerId: number): Promise<any[]>;
  updateStatus(orderId: number, status: string): Promise<any>;
}

// ========== DTOs e Types ==========

export interface OrderResponse {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerIsPremium: boolean;
  deliveryAddress: DeliveryAddressResponse;
  items: OrderItemResponse[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  estimatedDeliveryTime: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  error: string;
}

export interface OrderItemResponse {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productDescription: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
}

export interface DeliveryAddressResponse {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  isPremium: boolean;
  addresses: any[];
}

export interface OrdersListResponse {
  orders: OrderResponse[];
  total: number;
  error: string;
}

export interface ValidateOrderResponse {
  isValid: boolean;
  message: string;
  order: OrderResponse | null;
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  message: string;
  order: OrderResponse | null;
}
