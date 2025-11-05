import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '../models/vehicle-type.enum';

@InputType()
export class CreateDeliveryPersonInput {
  @Field()
  @ApiProperty({ 
    description: 'Nome completo do entregador',
    example: 'João Silva',
    minLength: 3,
    maxLength: 100
  })
  @IsNotEmpty({ message: "Nome é obrigatório" })
  @IsString()
  @Length(3, 100, { message: "Nome deve ter entre 3 e 100 caracteres" })
  name: string;

  @Field()
  @ApiProperty({ 
    description: 'Email do entregador',
    example: 'joao.silva@example.com'
  })
  @IsNotEmpty({ message: "Email é obrigatório" })
  @IsEmail({}, { message: "Email inválido" })
  email: string;

  @Field()
  @ApiProperty({ 
    description: 'Telefone com código do país',
    example: '+5531987654321'
  })
  @IsNotEmpty({ message: "Telefone é obrigatório" })
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: "Telefone inválido" })
  phone: string;

  @Field()
  @ApiProperty({ 
    description: 'CPF com 11 dígitos',
    example: '12345678901',
    minLength: 11,
    maxLength: 11
  })
  @IsNotEmpty({ message: "CPF é obrigatório" })
  @IsString()
  @Length(11, 11, { message: "CPF deve ter 11 dígitos" })
  @Matches(/^\d{11}$/, { message: "CPF deve conter apenas números" })
  cpf: string;

  @Field(() => VehicleType)
  @ApiProperty({ 
    description: 'Tipo de veículo do entregador',
    enum: VehicleType,
    example: VehicleType.MOTORCYCLE
  })
  @IsNotEmpty({ message: "Tipo de veículo é obrigatório" })
  @IsEnum(VehicleType, { message: "Tipo de veículo inválido" })
  vehicleType: VehicleType;

  @Field({ nullable: true })
  @ApiPropertyOptional({ 
    description: 'Placa do veículo',
    example: 'ABC1234'
  })
  @IsOptional()
  @IsString()
  licensePlate?: string;
}
