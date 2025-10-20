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
import type { Order } from 'generated/prisma';
import { UpdateOrderInput } from './dto/update-order.input';

@Resolver('Order')
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

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

  // @Query('customerOrders')
  // async getCustomerOrders(@Args('customerId') customerId: string) {
  //   return this.ordersService.findByCustomer(customerId);
  // }

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

  // @Mutation('updateOrderStatus')
  // async updateOrder(@Args('input') input: UpdateOrderInput) {
  //   return this.ordersService.updateStatus(input.id, input.status);
  // }
}
