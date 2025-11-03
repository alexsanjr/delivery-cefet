import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

@InputType()
export class CreateTrackingInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  delivery_id: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  order_id: string;

  @Field()
  @IsNumber()
  destination_lat: number;

  @Field()
  @IsNumber()
  destination_lng: number;
}