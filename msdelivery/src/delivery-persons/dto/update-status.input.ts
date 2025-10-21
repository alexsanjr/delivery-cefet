import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { DeliveryPersonStatus } from '@prisma/client';

@InputType()
export class UpdateStatusInput {
  @Field()
  @IsNotEmpty({ message: "ID do entregador é obrigatório" })
  deliveryPersonId: string;

  @Field()
  @IsNotEmpty({ message: "Status é obrigatório" })
  @IsEnum(DeliveryPersonStatus, { message: "Status inválido" })
  status: DeliveryPersonStatus;
}
