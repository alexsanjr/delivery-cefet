import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { DeliveryPersonStatus } from '../models/delivery-person-status.enum';

export class UpdateStatusBodyDto {
  @ApiProperty({ 
    description: 'Novo status do entregador',
    enum: DeliveryPersonStatus,
    example: DeliveryPersonStatus.AVAILABLE,
    enumName: 'DeliveryPersonStatus'
  })
  @IsNotEmpty({ message: "Status é obrigatório" })
  @IsEnum(DeliveryPersonStatus, { message: "Status inválido" })
  status: DeliveryPersonStatus;
}
