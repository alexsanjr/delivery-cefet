import { DeliveryStatus } from '../../../domain/enums/delivery-status.enum';

export interface UpdateDeliveryStatusDto {
  deliveryId: number;
  status: DeliveryStatus;
}
