// src/tracking/dto/update-position.input.ts
import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

@InputType()
export class UpdatePositionInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  delivery_id: string;

  @Field()
  @IsNumber()
  latitude: number;

  @Field()
  @IsNumber()
  longitude: number;

  @Field()
  @IsNotEmpty()
  @IsString()
  delivery_person_id: string;
}