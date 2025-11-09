import { Module } from '@nestjs/common';
import { CustomersService } from './services/customers.service';
import { CustomersResolver } from './resolvers/customers.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CustomerRepository } from './repositories/customer.repository';
import { AddressRepository } from './repositories/address.repository';
import { CustomerRepositoryLogger } from './repositories/customer.repository.logger';
import { AddressRepositoryLogger } from './repositories/address.repository.logger';
import { CustomerValidator } from './validators/customer.validator';
import { AddressValidator } from './validators/address.validator';

/**
 * SOLID Principles in Module Configuration:
 * 
 * D - Dependency Inversion:
 *     Registra interfaces com suas implementações concretas.
 *     Permite trocar implementações facilmente (ex: cache, mock para testes).
 * 
 * S - Single Responsibility:
 *     Cada provider tem responsabilidade única e bem definida.
 * 
 * O - Open/Closed (Decorator Pattern):
 *     Logging adicionado através de decorators SEM modificar repositories.
 *     CustomerRepositoryLogger envolve CustomerRepository.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    CustomersResolver,
    CustomersService,
    {
      provide: 'ICustomerRepository.Base',
      useClass: CustomerRepository,
    },
    {
      provide: 'IAddressRepository.Base',
      useClass: AddressRepository,
    },
    {
      provide: 'ICustomerRepository',
      useClass: CustomerRepositoryLogger,
    },
    {
      provide: 'IAddressRepository',
      useClass: AddressRepositoryLogger,
    },
    CustomerValidator,
    AddressValidator,
  ],
  exports: [CustomersService]
})
export class CustomersModule { }
