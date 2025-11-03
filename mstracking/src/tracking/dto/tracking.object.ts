import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PositionObject {
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
  delivery_id: string;

  @Field(() => [PositionObject])
  positions: PositionObject[];

  @Field()
  status: string;

  @Field({ nullable: true })
  estimated_arrival?: string;

  @Field({ nullable: true })
  distance_remaining?: number;
}