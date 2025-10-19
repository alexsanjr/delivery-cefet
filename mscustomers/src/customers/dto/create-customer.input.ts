import { InputType, Field } from '@nestjs/graphql';
import { CreateAddressInput } from './create-address.input';

@InputType()
export class CreateCustomerInput {
  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field(() => CreateAddressInput, { nullable: true })
  address?: CreateAddressInput | null;
}