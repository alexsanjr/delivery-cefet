import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { CreateOrderUseCase } from '../../../application/use-cases/create-order/create-order.use-case';
import { UpdateOrderStatusUseCase } from '../../../application/use-cases/update-order-status/update-order-status.use-case';
import { GetOrderUseCase } from '../../../application/use-cases/get-order/get-order.use-case';
import { ListOrdersUseCase } from '../../../application/use-cases/list-orders/list-orders.use-case';
import { CreateOrderDto } from '../../../application/dto/create-order.dto';
import { UpdateOrderStatusDto } from '../../../application/dto/update-order-status.dto';

@Resolver('Order')
export class OrdersHexagonalResolver {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly listOrdersUseCase: ListOrdersUseCase,
  ) {}

  @Query('order')
  async getOrder(@Args('id', { type: () => Int }) id: number) {
    return this.getOrderUseCase.execute(id);
  }

  @Query('orders')
  async getOrders(
    @Args('customerId', { type: () => Int, nullable: true })
    customerId?: number,
  ) {
    return this.listOrdersUseCase.execute(customerId);
  }

  @Mutation('createOrder')
  async createOrder(@Args('input') input: any) {
    const dto: CreateOrderDto = {
      customerId: input.customerId,
      paymentMethod: input.paymentMethod,
      items: input.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      deliveryAddress: {
        street: input.deliveryAddress.street,
        number: input.deliveryAddress.number,
        neighborhood: input.deliveryAddress.neighborhood,
        city: input.deliveryAddress.city,
        state: input.deliveryAddress.state,
        zipCode: input.deliveryAddress.zipCode,
        complement: input.deliveryAddress.complement,
        latitude: input.deliveryAddress.latitude,
        longitude: input.deliveryAddress.longitude,
      },
      deliveryFee: input.deliveryFee,
    };

    return this.createOrderUseCase.execute(dto);
  }

  @Mutation('updateOrderStatus')
  async updateOrderStatus(
    @Args('orderId', { type: () => Int }) orderId: number,
    @Args('newStatus') newStatus: string,
  ) {
    const dto: UpdateOrderStatusDto = { orderId, newStatus };
    return this.updateOrderStatusUseCase.execute(dto);
  }
}
