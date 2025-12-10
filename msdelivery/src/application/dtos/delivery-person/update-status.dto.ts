import { DeliveryPersonStatus } from '../../../domain/enums/delivery-person-status.enum';

export interface UpdateDeliveryPersonStatusDto {
  deliveryPersonId: number;
  status: DeliveryPersonStatus;
}
