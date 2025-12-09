import { DeliveryPersonStatus } from '../../../domain/enums/delivery-person-status.enum';
import { VehicleType } from '../../../domain/enums/vehicle-type.enum';

export interface DeliveryPersonResponseDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  vehicleType: VehicleType;
  licensePlate?: string;
  status: DeliveryPersonStatus;
  rating: number;
  totalDeliveries: number;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
