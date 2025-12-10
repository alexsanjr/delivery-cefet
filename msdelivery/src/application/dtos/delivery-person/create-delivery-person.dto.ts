import { VehicleType } from '../../../domain/enums/vehicle-type.enum';

export interface CreateDeliveryPersonDto {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  vehicleType: VehicleType;
  licensePlate?: string;
}
