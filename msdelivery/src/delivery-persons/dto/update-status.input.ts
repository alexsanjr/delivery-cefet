import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeliveryPersonStatus } from '../models/delivery-person-status.enum';

@InputType()
export class UpdateStatusInput {
  @Field(() => Int)
  @ApiProperty({ 
    description: 'ID do entregador',
    example: 1
  })
  @IsNotEmpty({ message: "ID do entregador é obrigatório" })
  @IsInt()
  deliveryPersonId: number;

  @Field(() => String)
  @ApiProperty({ 
    description: 'Novo status do entregador',
    enum: DeliveryPersonStatus,
    example: DeliveryPersonStatus.AVAILABLE
  })
  @IsNotEmpty({ message: "Status é obrigatório" })
  @IsEnum(DeliveryPersonStatus, { message: "Status inválido" })
  status: DeliveryPersonStatus;
}
