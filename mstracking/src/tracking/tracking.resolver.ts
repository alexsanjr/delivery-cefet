import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { TrackingService } from './services/tracking.service';
import { CreateTrackingInput } from './dto/create-tracking.input';
import { UpdatePositionInput } from './dto/update-position.input';
import { TrackingObject, PositionObject } from './dto/tracking.object';
import { PubSub } from 'graphql-subscriptions';

@Resolver(() => TrackingObject)
export class TrackingResolver {
  private pubSub: PubSub;

  constructor(private readonly trackingService: TrackingService) {
    this.pubSub = new PubSub();
  }

  @Query(() => TrackingObject)
  async getTracking(@Args('deliveryId') deliveryId: string): Promise<TrackingObject> {
    return this.trackingService.getTrackingData(deliveryId);
  }

  @Query(() => [TrackingObject])
  async getActiveTrackings(): Promise<TrackingObject[]> {
    return this.trackingService.getActiveDeliveries();
  }

  @Mutation(() => TrackingObject)
  async startTracking(@Args('input') input: CreateTrackingInput): Promise<TrackingObject> {
    const position = await this.trackingService.startTracking(input);
    return this.trackingService.getTrackingData(input.delivery_id);
  }

  @Mutation(() => Boolean)
  async updatePosition(@Args('input') input: UpdatePositionInput): Promise<boolean> {
    await this.trackingService.updatePosition(input);
    return true;
  }

  @Mutation(() => Boolean)
  async markAsDelivered(
    @Args('orderId') orderId: string,
    @Args('deliveryId') deliveryId: string,
  ): Promise<boolean> {
    await this.trackingService.markAsDelivered(orderId, deliveryId);
    return true;
  }

  @Subscription(() => PositionObject, {
    filter: (payload, variables) =>
      payload.positionUpdated.delivery_id === variables.deliveryId,
  })
  positionUpdated(@Args('deliveryId') deliveryId: string) {
    return (this.pubSub as any).asyncIterator('positionUpdated');
  }
}