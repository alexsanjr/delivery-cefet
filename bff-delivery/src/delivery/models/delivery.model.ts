import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class DeliveryPerson {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field({ nullable: true })
  cpf?: string;

  @Field()
  vehicleType: string;

  @Field()
  licensePlate: string;

  @Field()
  status: string;

  @Field(() => Float)
  rating: number;

  @Field(() => Int)
  totalDeliveries: number;

  @Field(() => Float, { nullable: true })
  currentLatitude?: number;

  @Field(() => Float, { nullable: true })
  currentLongitude?: number;

  @Field({ nullable: true })
  lastLocationUpdate?: string;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  createdAt?: string;

  @Field({ nullable: true })
  updatedAt?: string;
}

@ObjectType()
export class MutationResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => DeliveryPerson, { nullable: true })
  deliveryPerson?: DeliveryPerson;
}

@ObjectType()
export class Delivery {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  orderId: number;

  @Field(() => Int, { nullable: true })
  deliveryPersonId?: number;

  @Field()
  status: string;

  @Field(() => Float)
  customerLatitude: number;

  @Field(() => Float)
  customerLongitude: number;

  @Field()
  customerAddress: string;

  @Field({ nullable: true })
  assignedAt?: string;

  @Field({ nullable: true })
  pickedUpAt?: string;

  @Field({ nullable: true })
  deliveredAt?: string;

  @Field(() => Int, { nullable: true })
  estimatedDeliveryTime?: number;

  @Field(() => DeliveryPerson, { nullable: true })
  deliveryPerson?: DeliveryPerson;
}
