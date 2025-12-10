import { VehicleType } from '../../../domain/enums/vehicle-type.enum';

export interface UpdateDeliveryPersonDto {
  name?: string;
  email?: string;
  phone?: string;
  vehicleType?: VehicleType;
  licensePlate?: string;
}
