import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class Location {
  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;

  @Field(() => Float, { nullable: true })
  accuracy?: number;

  @Field(() => Float, { nullable: true })
  speed?: number;

  @Field(() => Float, { nullable: true })
  heading?: number;

  @Field()
  timestamp: Date;
}
