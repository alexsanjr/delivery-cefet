import { Module } from '@nestjs/common';
import { ApplicationModule } from '../../application/application.module';
import { CustomersResolver } from './resolvers/customers.resolver';

// Módulo GraphQL com resolvers
@Module({
  imports: [ApplicationModule],
  providers: [CustomersResolver],
  exports: [CustomersResolver],
})
export class GraphqlModule {}
