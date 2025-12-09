import { IsOptional, IsString, IsEmail, IsEnum, Length, Matches } from 'class-validator';
import { VehicleType } from '../models/vehicle-type.enum';

export class UpdateDeliveryPersonGrpcDto {
  @IsOptional()
  @IsString()
  @Length(3, 100, { message: "Nome deve ter entre 3 e 100 caracteres" })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: "Email inválido" })
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: "Telefone inválido" })
  phone?: string;

  @IsOptional()
  @IsEnum(VehicleType, { message: "Tipo de veículo inválido" })
  vehicleType?: VehicleType;

  @IsOptional()
  @IsString()
  licensePlate?: string;
}
