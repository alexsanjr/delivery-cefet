import { ObjectType, Field, ID, Float, Int, registerEnumType } from '@nestjs/graphql';
import { DeliveryPersonStatus, VehicleType } from '@prisma/client';

registerEnumType(DeliveryPersonStatus, {
  name: 'DeliveryPersonStatus',
});

registerEnumType(VehicleType, {
  name: 'VehicleType',
});

@ObjectType()
export class DeliveryPerson {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field()
  cpf: string;

  @Field(() => VehicleType)
  vehicleType: VehicleType;

  @Field({ nullable: true })
  licensePlate?: string;

  @Field(() => DeliveryPersonStatus)
  status: DeliveryPersonStatus;

  @Field(() => Float)
  rating: number;

  @Field(() => Int)
  totalDeliveries: number;

  @Field(() => Float, { nullable: true })
  currentLatitude?: number;

  @Field(() => Float, { nullable: true })
  currentLongitude?: number;

  @Field({ nullable: true })
  lastLocationUpdate?: Date;

  @Field()
  isActive: boolean;

  @Field()
  joinedAt: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
