import { Address } from '@prisma/client';
import { CreateAddressInput } from '../../dto/create-address.input';
import { UpdateAddressInput } from '../../dto/update-address.input';

/**
 * Interface Segregation Principle (I):
 * Interface separada para operações de Address, sem sobrecarregar
 * a interface de Customer com responsabilidades de Address.
 * 
 * Single Responsibility Principle (S):
 * Responsável APENAS por operações de endereço.
 */
export interface IAddressRepository {
  addToCustomer(customerId: number, data: CreateAddressInput): Promise<Address>;
  update(addressId: number, data: UpdateAddressInput): Promise<Address>;
  findById(addressId: number): Promise<Address | null>;
  removePrimaryFromCustomer(customerId: number): Promise<void>;
  setPrimary(addressId: number): Promise<Address>;
  remove(addressId: number): Promise<void>;
}
