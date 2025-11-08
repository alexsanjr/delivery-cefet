import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { DeliveriesService } from './deliveries.service';
import { Delivery } from './models/delivery.model';

@Resolver(() => Delivery)
export class DeliveriesResolver {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Mutation(() => Delivery)
  async assignDelivery(@Args('orderId', { type: () => Int }) orderId: number) {
    return this.deliveriesService.assignDeliveryToOrder(orderId);
  }

  @Query(() => [Delivery])
  async deliveries() {
    return this.deliveriesService.findAll();
  }

  @Query(() => Delivery, { nullable: true })
  async deliveryByOrder(@Args('orderId', { type: () => Int }) orderId: number) {
    return this.deliveriesService.findByOrderId(orderId);
  }

  @Query(() => [Delivery])
  async deliveriesByDeliveryPerson(
    @Args('deliveryPersonId', { type: () => Int }) deliveryPersonId: number,
  ) {
    return this.deliveriesService.findByDeliveryPersonId(deliveryPersonId);
  }
}
