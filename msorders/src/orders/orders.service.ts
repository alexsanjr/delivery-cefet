import { Injectable } from '@nestjs/common';
import { CreateOrderInput } from './dto/create-order.input';
import { OrdersDatasource } from './orders.datasource';

@Injectable()
export class OrdersService {
  constructor(private readonly ordersDatasource: OrdersDatasource) {}

  async create(createOrderInput: CreateOrderInput) {
    // Cálculos de negócio
    const subtotal = 100.0; //this.calculateSubtotal(createOrderInput.items);
    const deliveryFee = this.calculateDeliveryFee();
    const total = subtotal + deliveryFee;
    const estimatedDeliveryTime = this.calculateDeliveryTime();

    // Preparar dados para persistência
    const orderData = {
      ...createOrderInput,
      subtotal,
      deliveryFee,
      total,
      estimatedDeliveryTime,
      status: 'PENDING' as const,
    };

    return this.ordersDatasource.create(orderData);
  }

  // async findAll() {
  //   return this.ordersRepository.findAll();
  // }

  // async findById(id: string) {
  //   const order = await this.ordersRepository.findById(id);
  //   if (!order) {
  //     throw new NotFoundException(`Order ${id} not found`);
  //   }
  //   return order;
  // }

  // async findByCustomer(customerId: string) {
  //   return this.ordersRepository.findByCustomer(customerId);
  // }

  // async updateStatus(orderId: string, status: string) {
  //   await this.findById(orderId); // Valida se existe
  //   return this.ordersRepository.updateStatus(orderId, status);
  // }

  // Regras de negócio
  // private calculateSubtotal(items: any[]): number {
  //   return items.reduce((total, item) => {
  //     return total + item.quantity * item.price;
  //   }, 0);
  // }

  private calculateDeliveryFee(): number {
    // deliveryAddress: any
    const baseFee = 5.0;
    // Aqui viria lógica complexa de cálculo de frete
    return baseFee;
  }

  private calculateDeliveryTime(): number {
    // deliveryAddress: any adicionar dps
    const baseTime = 30;
    // Aqui viria lógica de cálculo de tempo baseada na distância
    return baseTime;
  }
}
