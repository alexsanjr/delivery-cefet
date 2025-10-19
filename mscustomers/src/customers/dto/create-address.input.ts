import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateAddressInput {
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
  complement?: string;

  @Field({ nullable: true })
  isPrimary?: boolean;
}