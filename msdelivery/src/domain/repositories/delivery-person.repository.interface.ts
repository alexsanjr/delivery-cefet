import { DeliveryPersonEntity } from '../entities/delivery-person.entity';
import { DeliveryPersonStatus } from '../enums/delivery-person-status.enum';

export interface IDeliveryPersonRepository {
  findById(id: number): Promise<DeliveryPersonEntity | null>;
  findByEmail(email: string): Promise<DeliveryPersonEntity | null>;
  findByCpf(cpf: string): Promise<DeliveryPersonEntity | null>;
  findByPhone(phone: string): Promise<DeliveryPersonEntity | null>;
  findByLicensePlate(licensePlate: string): Promise<DeliveryPersonEntity | null>;
  findAll(status?: DeliveryPersonStatus, isActive?: boolean): Promise<DeliveryPersonEntity[]>;
  findAvailableNearby(latitude: number, longitude: number, radiusKm: number): Promise<DeliveryPersonEntity[]>;
  save(deliveryPerson: DeliveryPersonEntity): Promise<DeliveryPersonEntity>;
  update(deliveryPerson: DeliveryPersonEntity): Promise<DeliveryPersonEntity>;
  delete(id: number): Promise<void>;
}

export const DELIVERY_PERSON_REPOSITORY = Symbol('IDeliveryPersonRepository');
