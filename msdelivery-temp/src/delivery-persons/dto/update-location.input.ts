import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@InputType()
export class UpdateLocationInput {
  @Field()
  @ApiProperty({ 
    description: 'ID do entregador',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty({ message: "ID do entregador é obrigatório" })
  deliveryPersonId: string;

  @Field(() => Float)
  @ApiProperty({ 
    description: 'Latitude da localização',
    example: -19.9191,
    minimum: -90,
    maximum: 90
  })
  @IsNotEmpty({ message: "Latitude é obrigatória" })
  @IsNumber({}, { message: "Latitude deve ser um número" })
  @Min(-90, { message: "Latitude deve ser maior ou igual a -90" })
  @Max(90, { message: "Latitude deve ser menor ou igual a 90" })
  latitude: number;

  @Field(() => Float)
  @ApiProperty({ 
    description: 'Longitude da localização',
    example: -43.9386,
    minimum: -180,
    maximum: 180
  })
  @IsNotEmpty({ message: "Longitude é obrigatória" })
  @IsNumber({}, { message: "Longitude deve ser um número" })
  @Min(-180, { message: "Longitude deve ser maior ou igual a -180" })
  @Max(180, { message: "Longitude deve ser menor ou igual a 180" })
  longitude: number;

  @Field(() => Float, { nullable: true })
  @ApiPropertyOptional({ 
    description: 'Precisão em metros',
    example: 10.5
  })
  @IsOptional()
  @IsNumber({}, { message: "Precisão deve ser um número" })
  accuracy?: number;

  @Field(() => Float, { nullable: true })
  @ApiPropertyOptional({ 
    description: 'Velocidade em m/s',
    example: 5.5
  })
  @IsOptional()
  @IsNumber({}, { message: "Velocidade deve ser um número" })
  speed?: number;

  @Field(() => Float, { nullable: true })
  @ApiPropertyOptional({ 
    description: 'Direção em graus (0-360)',
    example: 180,
    minimum: 0,
    maximum: 360
  })
  @IsOptional()
  @IsNumber({}, { message: "Direção deve ser um número" })
  @Min(0, { message: "Direção deve ser maior ou igual a 0" })
  @Max(360, { message: "Direção deve ser menor ou igual a 360" })
  heading?: number;
}
