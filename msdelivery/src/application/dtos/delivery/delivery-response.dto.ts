import { DeliveryStatus } from '../../../domain/enums/delivery-status.enum';
import { DeliveryPersonResponseDto } from '../delivery-person/delivery-person-response.dto';

export interface DeliveryResponseDto {
  id: number;
  orderId: number;
  deliveryPersonId?: number;
  deliveryPerson?: DeliveryPersonResponseDto;
  status: DeliveryStatus;
  customerLatitude: number;
  customerLongitude: number;
  customerAddress: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  estimatedDeliveryTime?: number;
  actualDeliveryTime?: number;
  createdAt: string;
  updatedAt: string;
}
