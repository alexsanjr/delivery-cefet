import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeliveryPersonStatus } from '../models/delivery-person-status.enum';

@InputType()
export class UpdateStatusInput {
  @Field()
  @ApiProperty({ 
    description: 'ID do entregador',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty({ message: "ID do entregador é obrigatório" })
  deliveryPersonId: string;

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
