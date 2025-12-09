import { InputType, Field, Float, Int } from '@nestjs/graphql';

@InputType()
export class FindAvailableDeliveryPersonsInput {
  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;

  @Field(() => Float)
  radiusKm: number;

  @Field({ nullable: true })
  vehicleType?: string;
}

@InputType()
export class UpdateDeliveryPersonStatusInput {
  @Field(() => Int)
  deliveryPersonId: number;

  @Field()
  status: string;
}

@InputType()
export class UpdateDeliveryPersonLocationInput {
  @Field(() => Int)
  deliveryPersonId: number;

  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;

  @Field(() => Float, { nullable: true })
  speed?: number;

  @Field(() => Float, { nullable: true })
  heading?: number;

  @Field(() => Float, { nullable: true })
  accuracy?: number;
}

@InputType()
export class CreateDeliveryPersonInput {
  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field()
  cpf: string;

  @Field()
  vehicleType: string;

  @Field({ nullable: true })
  licensePlate?: string;
}

@InputType()
export class UpdateDeliveryPersonInput {
  @Field(() => Int)
  id: number;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  vehicleType?: string;

  @Field({ nullable: true })
  licensePlate?: string;
}

@InputType()
export class AssignDeliveryInput {
  @Field(() => Int)
  orderId: number;

  @Field(() => Int, { nullable: true })
  deliveryPersonId?: number;
}

@InputType()
export class CreateDeliveryInput {
  @Field(() => Int)
  orderId: number;

  @Field(() => Float)
  customerLatitude: number;

  @Field(() => Float)
  customerLongitude: number;

  @Field()
  customerAddress: string;
}
