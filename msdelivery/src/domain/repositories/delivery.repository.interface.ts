import { DeliveryEntity } from '../entities/delivery.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';

export interface IDeliveryRepository {
  findById(id: number): Promise<DeliveryEntity | null>;
  findByOrderId(orderId: number): Promise<DeliveryEntity | null>;
  findByStatuses(statuses: DeliveryStatus[]): Promise<DeliveryEntity[]>;
  findByDeliveryPersonId(deliveryPersonId: number): Promise<DeliveryEntity[]>;
  save(delivery: DeliveryEntity): Promise<DeliveryEntity>;
  update(delivery: DeliveryEntity): Promise<DeliveryEntity>;
}

export const DELIVERY_REPOSITORY = Symbol('IDeliveryRepository');
