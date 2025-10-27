import {
  Resolver,
  Mutation,
  Args,
  ResolveField,
  Parent,
  Query,
} from '@nestjs/graphql';
import { OrdersService } from './orders.service';
import { CreateOrderInput } from './dto/create-order.input';
import type { Order, OrderItem } from 'generated/prisma';
import { UpdateOrderInput } from './dto/update-order.input';
import { CustomersClient } from '../grpc/customers.client';

type OrderWithItems = Order & {
  items?: OrderItem[];
};

interface CustomerGrpcResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  isPremium: boolean;
  addresses?: Array<{
    id: number;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
  }>;
  error?: string;
}

@Resolver('Order')
export class OrdersResolver {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly customersClient: CustomersClient,
  ) {}

  @Query('orders')
  async getOrders() {
    try {
      return this.ordersService.findAll();
    } catch (error) {
      throw new Error(
        `Ocorreu um erro ao buscar os pedidos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  @Query('order')
  async getOrder(@Args('id') id: number) {
    try {
      return await this.ordersService.findById(id);
    } catch (error) {
      throw new Error(
        `Ocorreu um erro ${id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  @Query('customerOrders')
  async getCustomerOrders(@Args('customerId') customerId: number) {
    try {
      return this.ordersService.findByCustomer(customerId);
    } catch (error) {
      throw new Error(
        `Ocorreu um erro ${customerId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  @Mutation('updateOrder')
  async updateOrder(
    @Args('updateOrderInput') updateOrderInput: UpdateOrderInput,
  ) {
    try {
      console.log(updateOrderInput);
      return await this.ordersService.updateStatus(updateOrderInput);
    } catch (error) {
      throw new Error(
        `Ocorreu um erro ao atualizar o pedido ${updateOrderInput.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  @Mutation('createOrder')
  async createOrder(
    @Args('createOrderInput') createOrderInput: CreateOrderInput,
  ) {
    try {
      return await this.ordersService.create(createOrderInput);
    } catch (error) {
      throw new Error(
        `Ocorreu um erro ao criar o pedido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  @ResolveField('createdAt')
  getCreatedAt(@Parent() order: Order): string {
    return new Date(order.createdAt).toLocaleString('pt-BR');
  }

  @ResolveField('updatedAt')
  getUpdatedAt(@Parent() order: Order): string {
    return new Date(order.updatedAt).toLocaleString('pt-BR');
  }

  @ResolveField('items')
  getItems(@Parent() order: OrderWithItems) {
    return order.items || [];
  }

  private async getCustomerData(
    customerId: number,
  ): Promise<CustomerGrpcResponse | null> {
    try {
      const customer = (await this.customersClient.getCustomer(
        customerId,
      )) as CustomerGrpcResponse;

      if (customer.error) return null;
      return customer;
    } catch {
      return null;
    }
  }

  @ResolveField('customerName')
  async getCustomerName(@Parent() order: Order): Promise<string | null> {
    if (!order.customerId) return null;
    const customer = await this.getCustomerData(order.customerId);
    return customer?.name || null;
  }

  @ResolveField('customerEmail')
  async getCustomerEmail(@Parent() order: Order): Promise<string | null> {
    if (!order.customerId) return null;
    const customer = await this.getCustomerData(order.customerId);
    return customer?.email || null;
  }

  @ResolveField('customerPhone')
  async getCustomerPhone(@Parent() order: Order): Promise<string | null> {
    if (!order.customerId) return null;
    const customer = await this.getCustomerData(order.customerId);
    return customer?.phone || null;
  }

  @ResolveField('customerIsPremium')
  async getCustomerIsPremium(@Parent() order: Order): Promise<boolean | null> {
    if (!order.customerId) return null;
    const customer = await this.getCustomerData(order.customerId);
    return customer?.isPremium || null;
  }

  @ResolveField('customerAddresses')
  async getCustomerAddresses(@Parent() order: Order) {
    if (!order.customerId) return [];
    const customer = await this.getCustomerData(order.customerId);
    return customer?.addresses || [];
  }
}
