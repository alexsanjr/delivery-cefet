import {
  Resolver,
  Mutation,
  Args,
  ResolveField,
  Parent,
  Query,
  Float,
} from '@nestjs/graphql';
import { OrdersService } from './orders.service';
import { CreateOrderInput } from './dto/create-order.input';
import type { Order, OrderItem } from '../../generated/prisma';
import { UpdateOrderInput } from './dto/update-order.input';
import { CustomersDataloaderService } from './customers-dataloader.service';

type OrderWithItems = Order & {
  items?: OrderItem[];
};

@Resolver('Order')
export class OrdersResolver {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly customersDataloader: CustomersDataloaderService,
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

  @Query('testGrpcRouting')
  async testGrpcRouting(
    @Args('originLat', { type: () => Float }) originLat: number,
    @Args('originLng', { type: () => Float }) originLng: number,
    @Args('destLat', { type: () => Float }) destLat: number,
    @Args('destLng', { type: () => Float }) destLng: number,
  ): Promise<string> {
    try {
      const result = await firstValueFrom(
        this.routingClient.calculateRoute(
          { latitude: originLat, longitude: originLng },
          { latitude: destLat, longitude: destLng },
          'fastest',
        ),
      );
      return JSON.stringify(result);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  @Query('testGrpcNotifications')
  async testGrpcNotifications(
    @Args('userId') userId: string,
    @Args('orderId') orderId: string,
    @Args('status') status: string,
  ): Promise<string> {
    try {
      const result = await firstValueFrom(
        this.notificationsClient.sendNotification(
          userId,
          orderId,
          status,
          `Test notification for order ${orderId}`,
        ),
      );
      return JSON.stringify(result);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
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
    return new Date(order.createdAt).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });
  }

  @ResolveField('updatedAt')
  getUpdatedAt(@Parent() order: Order): string {
    return new Date(order.updatedAt).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });
  }

  @ResolveField('items')
  getItems(@Parent() order: OrderWithItems) {
    return order.items || [];
  }

  @ResolveField('customerName')
  async getCustomerName(@Parent() order: Order): Promise<string | null> {
    if (!order.customerId) return null;
    const customer = await this.customersDataloader.load(order.customerId);
    return customer?.name || null;
  }

  @ResolveField('customerEmail')
  async getCustomerEmail(@Parent() order: Order): Promise<string | null> {
    if (!order.customerId) return null;
    const customer = await this.customersDataloader.load(order.customerId);
    return customer?.email || null;
  }

  @ResolveField('customerPhone')
  async getCustomerPhone(@Parent() order: Order): Promise<string | null> {
    if (!order.customerId) return null;
    const customer = await this.customersDataloader.load(order.customerId);
    return customer?.phone || null;
  }

  @ResolveField('customerIsPremium')
  async getCustomerIsPremium(@Parent() order: Order): Promise<boolean | null> {
    if (!order.customerId) return null;
    const customer = await this.customersDataloader.load(order.customerId);
    return customer?.isPremium || null;
  }

  @ResolveField('customerAddresses')
  async getCustomerAddresses(@Parent() order: Order) {
    if (!order.customerId) return [];
    const customer = await this.customersDataloader.load(order.customerId);
    return customer?.addresses || [];
  }
}
