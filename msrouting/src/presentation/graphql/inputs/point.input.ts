import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNumber, Min, Max } from 'class-validator';

@InputType()
export class PointInput {
  @Field(() => Float, { description: 'Latitude do ponto geográfico' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @Field(() => Float, { description: 'Longitude do ponto geográfico' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
