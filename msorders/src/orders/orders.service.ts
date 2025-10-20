import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderInput } from './dto/create-order.input';
import { OrdersDatasource } from './orders.datasource';
import { UpdateOrderInput } from './dto/update-order.input';

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

  async findAll() {
    return this.ordersDatasource.findAll();
  }

  async findById(id: number) {
    const order = await this.ordersDatasource.findById(id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  // async findByCustomer(customerId: string) {
  //   return this.ordersRepository.findByCustomer(customerId);
  // }

  async updateStatus(orderData: UpdateOrderInput) {
    try {
      await this.findById(orderData.id);
      return this.ordersDatasource.updateStatus(orderData);
    } catch (error) {
      throw new Error(
        `Ocorreu um erro ao atualizar o status do pedido ${orderData.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

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
