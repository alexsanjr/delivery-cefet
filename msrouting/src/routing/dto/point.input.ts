import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

@InputType()
export class PointInput {
  @Field(() => Float, { description: 'Latitude da localização' })
  @IsNotEmpty({ message: 'Latitude é obrigatória' })
  @IsNumber({}, { message: 'Latitude deve ser um número' })
  @Min(-90, { message: 'Latitude deve ser maior ou igual a -90' })
  @Max(90, { message: 'Latitude deve ser menor ou igual a 90' })
  latitude: number;

  @Field(() => Float, { description: 'Longitude da localização' })
  @IsNotEmpty({ message: 'Longitude é obrigatória' })
  @IsNumber({}, { message: 'Longitude deve ser um número' })
  @Min(-180, { message: 'Longitude deve ser maior ou igual a -180' })
  @Max(180, { message: 'Longitude deve ser menor ou igual a 180' })
  longitude: number;
}
