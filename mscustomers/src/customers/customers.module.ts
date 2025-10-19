import { Module } from '@nestjs/common';
import { CustomersService } from './services/customers.service';
import { CustomersResolver } from './resolvers/customers.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    CustomersResolver,
    CustomersService
  ],
  exports: [CustomersService]
})
export class CustomersModule { }
