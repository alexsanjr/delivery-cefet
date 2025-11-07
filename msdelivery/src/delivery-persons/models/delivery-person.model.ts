import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { DeliveryPersonStatus } from './delivery-person-status.enum';
import { VehicleType } from './vehicle-type.enum';

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
