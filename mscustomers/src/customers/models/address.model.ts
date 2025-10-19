import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Address {
  @Field(() => ID)
  id: string;

  @Field()
  street: string;

  @Field()
  number: string;

  @Field()
  neighborhood: string;

  @Field()
  city: string;

  @Field()
  state: string;

  @Field()
  zipCode: string;

  @Field({ nullable: true })
  complement?: string | null;

  @Field()
  isPrimary: boolean;

  @Field()
  createdAt: Date;
}