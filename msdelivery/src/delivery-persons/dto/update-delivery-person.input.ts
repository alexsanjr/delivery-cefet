import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsOptional, IsString, IsEmail, IsEnum, Length, Matches } from 'class-validator';
import { CreateDeliveryPersonInput } from './create-delivery-person.input';
import { VehicleType } from '@prisma/client';

@InputType()
export class UpdateDeliveryPersonInput extends PartialType(CreateDeliveryPersonInput) {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(3, 100, { message: "Nome deve ter entre 3 e 100 caracteres" })
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail({}, { message: "Email inválido" })
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: "Telefone inválido" })
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(VehicleType, { message: "Tipo de veículo inválido" })
  vehicleType?: VehicleType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  licensePlate?: string;
}
