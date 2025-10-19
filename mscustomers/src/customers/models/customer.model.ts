import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Address } from './address.model';

@ObjectType()
export class Customer {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field(() => [Address])
  addresses: Address[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}