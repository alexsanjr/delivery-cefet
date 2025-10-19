import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateAddressInput {
  @Field({ nullable: true })
  street?: string;

  @Field({ nullable: true })
  number?: string;

  @Field({ nullable: true })
  neighborhood?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  zipCode?: string;

  @Field({ nullable: true })
  complement?: string;

  @Field({ nullable: true })
  isPrimary?: boolean;
}