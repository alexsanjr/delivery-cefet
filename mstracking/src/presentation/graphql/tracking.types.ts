import { Field, ObjectType, InputType } from '@nestjs/graphql';

@ObjectType()
export class PositionObject {
    @Field()
    deliveryId: string;

    @Field()
    latitude: number;

    @Field()
    longitude: number;

    @Field()
    timestamp: string;
}

@ObjectType()
export class TrackingObject {
  @Field()
  deliveryId: string;

  @Field()
  orderId: string;

  @Field(() => [PositionObject])
  positions: PositionObject[];

  @Field()
  status: string;

  @Field({ nullable: true })
  estimatedArrival?: string;

  @Field({ nullable: true })
  distanceRemaining?: number;
}

@InputType()
export class CreateTrackingInput {
  @Field()
  deliveryId: string;

  @Field()
  orderId: string;

  @Field()
  originLat: number;

  @Field()
  originLng: number;

  @Field()
  destinationLat: number;

  @Field()
  destinationLng: number;
}

@InputType()
export class UpdatePositionInput {
  @Field()
  deliveryId: string;

  @Field()
  latitude: number;

  @Field()
  longitude: number;

  @Field()
  deliveryPersonId: string;
}
