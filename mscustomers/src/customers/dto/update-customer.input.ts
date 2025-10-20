import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateCustomerInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  isPremium?: boolean;
}