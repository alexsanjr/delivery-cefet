import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { DeliveryPerson } from '../../delivery-persons/models/delivery-person.model';

export enum DeliveryStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

registerEnumType(DeliveryStatus, {
  name: 'DeliveryStatus',
});

@ObjectType()
export class Delivery {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  orderId: number;

  @Field(() => Int, { nullable: true })
  deliveryPersonId?: number;

  @Field(() => DeliveryPerson, { nullable: true })
  deliveryPerson?: DeliveryPerson;

  @Field(() => DeliveryStatus)
  status: DeliveryStatus;

  @Field()
  customerLatitude: number;

  @Field()
  customerLongitude: number;

  @Field()
  customerAddress: string;

  @Field({ nullable: true })
  assignedAt?: Date;

  @Field({ nullable: true })
  pickedUpAt?: Date;

  @Field({ nullable: true })
  deliveredAt?: Date;

  @Field({ nullable: true })
  cancelledAt?: Date;

  @Field(() => Int, { nullable: true })
  estimatedDeliveryTime?: number;

  @Field(() => Int, { nullable: true })
  actualDeliveryTime?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
