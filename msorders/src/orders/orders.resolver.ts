import {
  Resolver,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { OrdersService } from './orders.service';
import { CreateOrderInput } from './dto/create-order.input';

@Resolver('Order')
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  // @Query('orders')
  // async getOrders() {
  //   return this.ordersService.findAll();
  // }

  // @Query('order')
  // async getOrder(@Args('id') id: string) {
  //   return this.ordersService.findById(id);
  // }

  // @Query('customerOrders')
  // async getCustomerOrders(@Args('customerId') customerId: string) {
  //   return this.ordersService.findByCustomer(customerId);
  // }

  @Mutation('createOrder')
  async createOrder(
    @Args('createOrderInput') createOrderInput: CreateOrderInput,
  ) {
    console.log('Creating order with input:', createOrderInput);
    return this.ordersService.create(createOrderInput);
  }

  @ResolveField('createdAt')
  getCreatedAt(@Parent() order: any): string {
    return new Date(order.createdAt).toLocaleString('pt-BR');
  }

  @ResolveField('updatedAt')
  getUpdatedAt(@Parent() order: any): string {
    return new Date(order.updatedAt).toLocaleString('pt-BR');
  }

  // @Mutation('updateOrderStatus')
  // async updateOrder(@Args('input') input: UpdateOrderInput) {
  //   return this.ordersService.updateStatus(input.id, input.status);
  // }
}
