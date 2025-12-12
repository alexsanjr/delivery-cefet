export class OrderItemResponseDto {
  id: number;
  productId: number;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export class OrderResponseDto {
  id: number;
  customerId: number;
  status: string;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryFee: number;
  subtotal: number;
  total: number;
  estimatedDeliveryTime?: number;
  currency: string;
  items: OrderItemResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
