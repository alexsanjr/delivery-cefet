import { Customer, Address } from '@prisma/client';
import { CreateCustomerInput } from '../../dto/create-customer.input';
import { UpdateCustomerInput } from '../../dto/update-customer.input';
import { CreateAddressInput } from '../../dto/create-address.input';
import { UpdateAddressInput } from '../../dto/update-address.input';

/**
 * Interface Segregation Principle (I):
 * Interface específica para operações de Customer, sem misturar responsabilidades.
 * 
 * Dependency Inversion Principle (D):
 * Módulos de alto nível (CustomersService) dependem desta abstração,
 * não de implementações concretas (Prisma).
 */
export interface ICustomerRepository {
  findAll(): Promise<(Customer & { addresses: Address[] })[]>;
  findById(id: number): Promise<(Customer & { addresses: Address[] }) | null>;
  findByEmail(email: string): Promise<(Customer & { addresses: Address[] }) | null>;
  create(data: CreateCustomerInput): Promise<Customer & { addresses: Address[] }>;
  update(id: number, data: UpdateCustomerInput): Promise<Customer & { addresses: Address[] }>;
  existsByEmail(email: string): Promise<boolean>;
}
