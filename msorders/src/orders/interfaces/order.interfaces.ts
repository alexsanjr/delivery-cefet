import { Order } from '../../../generated/prisma';
import { CreateOrderInput } from '../dto/create-order.input';
import { UpdateOrderInput } from '../dto/update-order.input';

export interface OrderItem {
  price: number;
  quantity: number;
}

export interface OrderAddress {
  distance?: number;
}

export interface IOrderDatasource {
  create(orderData: CreateOrderInput): Promise<Order>;
  findById(id: number): Promise<Order | null>;
  findAll(): Promise<Order[]>;
  findByCustomer(customerId: number): Promise<Order[]>;
  updateStatus(orderData: UpdateOrderInput): Promise<Order>;
}

export interface IPriceCalculator {
  calculateSubtotal(items?: OrderItem[]): number;
  calculateDeliveryFee(address?: OrderAddress): number;
  calculateDeliveryTime(address?: OrderAddress): number;
}

export interface IOrderDatasource {
  create(orderData: CreateOrderInput): Promise<Order>;
  findById(id: number): Promise<Order | null>;
  findAll(): Promise<Order[]>;
  findByCustomer(customerId: number): Promise<Order[]>;
  updateStatus(orderData: UpdateOrderInput): Promise<Order>;
}

export interface IOrderValidator {
  validateCreateOrderInput(input: CreateOrderInput): void;
  validateUpdateOrderInput(input: UpdateOrderInput): Promise<void>;
}

export enum PriceStrategy {
  BASIC = 'basic',
  PREMIUM = 'premium',
  EXPRESS = 'express',
}

export interface CustomerGrpcResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  isPremium: boolean;
  addresses?: Array<{
    id?: number;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    isPrimary?: boolean;
  }>;
  error?: string;
}
