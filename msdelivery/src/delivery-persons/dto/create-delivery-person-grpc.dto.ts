import { IsNotEmpty, IsString, IsEmail, IsEnum, IsOptional, Length, Matches } from 'class-validator';
import { VehicleType } from '../models/vehicle-type.enum';

export class CreateDeliveryPersonGrpcDto {
  @IsNotEmpty({ message: "Nome é obrigatório" })
  @IsString()
  @Length(3, 100, { message: "Nome deve ter entre 3 e 100 caracteres" })
  name: string;

  @IsNotEmpty({ message: "Email é obrigatório" })
  @IsEmail({}, { message: "Email inválido" })
  email: string;

  @IsNotEmpty({ message: "Telefone é obrigatório" })
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: "Telefone inválido" })
  phone: string;

  @IsNotEmpty({ message: "CPF é obrigatório" })
  @IsString()
  @Length(11, 11, { message: "CPF deve ter 11 dígitos" })
  @Matches(/^\d{11}$/, { message: "CPF deve conter apenas números" })
  cpf: string;

  @IsNotEmpty({ message: "Tipo de veículo é obrigatório" })
  @IsEnum(VehicleType, { message: "Tipo de veículo inválido" })
  vehicleType: VehicleType;

  @IsOptional()
  @IsString()
  licensePlate?: string;
}
