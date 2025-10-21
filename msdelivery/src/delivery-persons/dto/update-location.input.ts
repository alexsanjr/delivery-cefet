import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';

@InputType()
export class UpdateLocationInput {
  @Field()
  @IsNotEmpty({ message: "ID do entregador é obrigatório" })
  deliveryPersonId: string;

  @Field(() => Float)
  @IsNotEmpty({ message: "Latitude é obrigatória" })
  @IsNumber({}, { message: "Latitude deve ser um número" })
  @Min(-90, { message: "Latitude deve ser maior ou igual a -90" })
  @Max(90, { message: "Latitude deve ser menor ou igual a 90" })
  latitude: number;

  @Field(() => Float)
  @IsNotEmpty({ message: "Longitude é obrigatória" })
  @IsNumber({}, { message: "Longitude deve ser um número" })
  @Min(-180, { message: "Longitude deve ser maior ou igual a -180" })
  @Max(180, { message: "Longitude deve ser menor ou igual a 180" })
  longitude: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: "Precisão deve ser um número" })
  accuracy?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: "Velocidade deve ser um número" })
  speed?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: "Direção deve ser um número" })
  @Min(0, { message: "Direção deve ser maior ou igual a 0" })
  @Max(360, { message: "Direção deve ser menor ou igual a 360" })
  heading?: number;
}
