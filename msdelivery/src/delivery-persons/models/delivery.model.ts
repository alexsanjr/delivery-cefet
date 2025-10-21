import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { DeliveryStatus } from '@prisma/client';
import { DeliveryPerson } from './delivery-person.model';
import { registerEnumType } from '@nestjs/graphql';

registerEnumType(DeliveryStatus, {
  name: 'DeliveryStatus',
});

@ObjectType()
export class Delivery {
  @Field(() => ID)
  id: string;

  @Field()
  orderId: string;

  @Field()
  deliveryPersonId: string;

  @Field(() => Float)
  pickupLatitude: number;

  @Field(() => Float)
  pickupLongitude: number;

  @Field(() => Float)
  deliveryLatitude: number;

  @Field(() => Float)
  deliveryLongitude: number;

  @Field(() => Float)
  estimatedDistance: number;

  @Field(() => Int)
  estimatedDuration: number;

  @Field(() => Float, { nullable: true })
  actualDistance?: number;

  @Field(() => Int, { nullable: true })
  actualDuration?: number;

  @Field(() => DeliveryStatus)
  status: DeliveryStatus;

  @Field()
  assignedAt: Date;

  @Field({ nullable: true })
  pickedUpAt?: Date;

  @Field({ nullable: true })
  deliveredAt?: Date;

  @Field({ nullable: true })
  deliveryNumber?: string;

  @Field(() => DeliveryPerson, { nullable: true })
  deliveryPerson?: DeliveryPerson;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
