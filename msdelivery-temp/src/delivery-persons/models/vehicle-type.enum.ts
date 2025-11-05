import { registerEnumType } from '@nestjs/graphql';

export enum VehicleType {
  BIKE = 'BIKE',
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  SCOOTER = 'SCOOTER',
  WALKING = 'WALKING',
}

registerEnumType(VehicleType, {
  name: 'VehicleType',
  description: 'Tipos de veículos disponíveis para entregadores',
});
