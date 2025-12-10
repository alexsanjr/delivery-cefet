import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
export class PointInput {
  @Field(() => Float, { description: 'Latitude do ponto geográfico' })
  latitude: number;

  @Field(() => Float, { description: 'Longitude do ponto geográfico' })
  longitude: number;
}
