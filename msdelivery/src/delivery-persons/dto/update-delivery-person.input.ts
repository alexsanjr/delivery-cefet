import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsOptional, IsString, IsEmail, IsEnum, Length, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateDeliveryPersonInput } from './create-delivery-person.input';
import { VehicleType } from '../models/vehicle-type.enum';

@InputType()
export class UpdateDeliveryPersonInput extends PartialType(CreateDeliveryPersonInput) {
  @Field({ nullable: true })
  @ApiPropertyOptional({ 
    description: 'Nome completo do entregador',
    example: 'João Silva',
    minLength: 3,
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @Length(3, 100, { message: "Nome deve ter entre 3 e 100 caracteres" })
  name?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ 
    description: 'Email do entregador',
    example: 'joao.silva@example.com'
  })
  @IsOptional()
  @IsEmail({}, { message: "Email inválido" })
  email?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ 
    description: 'Telefone com código do país',
    example: '+5531987654321'
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: "Telefone inválido" })
  phone?: string;

  @Field(() => VehicleType, { nullable: true })
  @ApiPropertyOptional({ 
    description: 'Tipo de veículo do entregador',
    enum: VehicleType,
    example: VehicleType.MOTORCYCLE
  })
  @IsOptional()
  @IsEnum(VehicleType, { message: "Tipo de veículo inválido" })
  vehicleType?: VehicleType;

  @Field({ nullable: true })
  @ApiPropertyOptional({ 
    description: 'Placa do veículo',
    example: 'ABC1234'
  })
  @IsOptional()
  @IsString()
  licensePlate?: string;
}
