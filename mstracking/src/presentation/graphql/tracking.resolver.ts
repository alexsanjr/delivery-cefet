import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { TrackingApplicationService } from '../../application/services/tracking-application.service';
import { TrackingObject, PositionObject, CreateTrackingInput, UpdatePositionInput } from './tracking.types';

@Resolver(() => TrackingObject)
export class TrackingResolver {
    private pubSub: PubSub;

    constructor(private readonly trackingService: TrackingApplicationService) {
        this.pubSub = new PubSub();
    }

    @Query(() => TrackingObject)
    async getTracking(@Args('deliveryId') deliveryId: string): Promise<TrackingObject> {
        const data = await this.trackingService.getTrackingData(deliveryId);
        return {
            deliveryId: data.deliveryId,
            orderId: data.orderId,
            positions: data.positions.map(p => ({
                deliveryId: data.deliveryId,
                latitude: p.latitude,
                longitude: p.longitude,
                timestamp: p.timestamp.toISOString(),
            })),
            status: data.status,
            estimatedArrival: data.estimatedArrival,
            distanceRemaining: data.distanceRemaining,
        };
    }

    @Query(() => [TrackingObject])
    async getActiveTrackings(): Promise<TrackingObject[]> {
        const deliveries = await this.trackingService.getActiveDeliveries();
        
        const trackings = await Promise.all(
            deliveries.map(async (d) => {
                const data = await this.trackingService.getTrackingData(d.deliveryId);
                return {
                    deliveryId: data.deliveryId,
                    orderId: data.orderId,
                    positions: data.positions.map(p => ({
                        deliveryId: data.deliveryId,
                        latitude: p.latitude,
                        longitude: p.longitude,
                        timestamp: p.timestamp.toISOString(),
                    })),
                    status: data.status,
                    estimatedArrival: data.estimatedArrival,
                    distanceRemaining: data.distanceRemaining,
                };
            })
        );

        return trackings;
    }

    @Mutation(() => TrackingObject)
    async startTracking(@Args('input') input: CreateTrackingInput): Promise<TrackingObject> {
        await this.trackingService.startTracking({
            deliveryId: input.deliveryId,
            orderId: input.orderId,
            originLat: input.originLat,
            originLng: input.originLng,
            destinationLat: input.destinationLat,
            destinationLng: input.destinationLng,
        });

        return this.getTracking(input.deliveryId);
    }

    @Mutation(() => Boolean)
    async updatePosition(@Args('input') input: UpdatePositionInput): Promise<boolean> {
        const position = await this.trackingService.updatePosition({
            deliveryId: input.deliveryId,
            latitude: input.latitude,
            longitude: input.longitude,
            deliveryPersonId: input.deliveryPersonId,
        });

        await this.pubSub.publish('positionUpdated', {
            positionUpdated: {
                deliveryId: position.deliveryId,
                latitude: position.latitude,
                longitude: position.longitude,
                timestamp: position.timestamp.toISOString(),
            },
        });

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
        filter: (payload, variables) => {
            return payload.positionUpdated.deliveryId === variables.deliveryId;
        },
    })
    positionUpdated(@Args('deliveryId') deliveryId: string) {
        return (this.pubSub as any).asyncIterator('positionUpdated');
    }
}
