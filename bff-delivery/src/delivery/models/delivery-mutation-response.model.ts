import { ObjectType, Field } from '@nestjs/graphql';
import { Delivery } from './delivery.model';

@ObjectType()
export class DeliveryMutationResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => Delivery, { nullable: true })
  delivery?: Delivery;
}
