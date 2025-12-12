import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { CreateOrderUseCase } from '../../../application/use-cases/create-order/create-order.use-case';
import { UpdateOrderStatusUseCase } from '../../../application/use-cases/update-order-status/update-order-status.use-case';
import { GetOrderUseCase } from '../../../application/use-cases/get-order/get-order.use-case';
import { ListOrdersUseCase } from '../../../application/use-cases/list-orders/list-orders.use-case';
import { CreateOrderDto } from '../../../application/dto/create-order.dto';
import { UpdateOrderStatusDto } from '../../../application/dto/update-order-status.dto';
import { ProductService } from '../../../product/product.service';
import { CustomersDataloaderService } from '../../../orders/customers-dataloader.service';

@Resolver('Order')
export class OrdersHexagonalResolver {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly listOrdersUseCase: ListOrdersUseCase,
    private readonly productService: ProductService,
    private readonly customersDataloader: CustomersDataloaderService,
  ) {}

  @Query('order')
  async getOrder(@Args('id', { type: () => Int }) id: number) {
    return this.getOrderUseCase.execute(id);
  }

  @Query('orders')
  async getOrders() {
    return this.listOrdersUseCase.execute();
  }

  @Query('customerOrders')
  async getCustomerOrders(
    @Args('customerId', { type: () => Int }) customerId: number,
  ) {
    return this.listOrdersUseCase.execute(customerId);
  }

  @Mutation('createOrder')
  async createOrder(@Args('createOrderInput') input: any) {
    // 1. Fetch product details
    const itemsWithDetails = await Promise.all(
      input.items.map(async (item: any) => {
        const product = await this.productService.findById(item.productId);
        return {
          productId: item.productId,
          productName: product.name,
          description: product.description,
          quantity: item.quantity,
          unitPrice: Number(product.price),
        };
      }),
    );

    // 2. Fetch customer address if not provided
    let deliveryAddress = input.deliveryAddress;
    if (!deliveryAddress) {
      const customer = await this.customersDataloader.load(input.customerId);
      if (customer && customer.addresses && customer.addresses.length > 0) {
        const defaultAddress =
          customer.addresses.find((a) => a.isDefault) || customer.addresses[0];
        deliveryAddress = {
          street: defaultAddress.street,
          number: defaultAddress.number,
          neighborhood: defaultAddress.neighborhood,
          city: defaultAddress.city,
          state: defaultAddress.state,
          zipCode: defaultAddress.zipCode,
          complement: defaultAddress.complement,
        };
      } else {
        // Fallback dummy address if customer has no address (should not happen in prod)
        deliveryAddress = {
          street: 'Rua Padrão',
          number: '0',
          neighborhood: 'Centro',
          city: 'Cidade',
          state: 'MG',
          zipCode: '00000000',
        };
      }
    }

    const dto: CreateOrderDto = {
      customerId: input.customerId,
      paymentMethod: input.paymentMethod,
      items: itemsWithDetails,
      deliveryAddress: {
        street: deliveryAddress.street,
        number: deliveryAddress.number,
        neighborhood: deliveryAddress.neighborhood,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        zipCode: deliveryAddress.zipCode,
        complement: deliveryAddress.complement,
        latitude: deliveryAddress.latitude,
        longitude: deliveryAddress.longitude,
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

  @Mutation('updateOrder')
  async updateOrder(@Args('updateOrderInput') input: any) {
    const dto: UpdateOrderStatusDto = {
      orderId: input.id,
      newStatus: input.status,
    };
    return this.updateOrderStatusUseCase.execute(dto);
  }

  @ResolveField()
  async customerName(@Parent() order: any) {
    const customer = await this.customersDataloader.load(order.customerId);
    return customer ? customer.name : null;
  }

  @ResolveField()
  async customerEmail(@Parent() order: any) {
    const customer = await this.customersDataloader.load(order.customerId);
    return customer ? customer.email : null;
  }

  @ResolveField()
  async customerPhone(@Parent() order: any) {
    const customer = await this.customersDataloader.load(order.customerId);
    return customer ? customer.phone : null;
  }

  @ResolveField()
  async customerIsPremium(@Parent() order: any) {
    const customer = await this.customersDataloader.load(order.customerId);
    return customer ? customer.isPremium : null;
  }

  @ResolveField()
  async customerAddresses(@Parent() order: any) {
    const customer = await this.customersDataloader.load(order.customerId);
    return customer ? customer.addresses : [];
  }
}
