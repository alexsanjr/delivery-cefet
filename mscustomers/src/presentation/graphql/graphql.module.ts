import { Module } from '@nestjs/common';
import { ApplicationModule } from '../../application/application.module';
import { CustomersResolver } from './resolvers/customers.resolver';
import { CustomerEventsConsumer } from '../../infrastructure/messaging/consumers/customer-events.consumer';

// Módulo GraphQL com resolvers e consumer RabbitMQ
@Module({
  imports: [ApplicationModule],
  providers: [CustomersResolver, CustomerEventsConsumer],
  exports: [CustomersResolver],
})
export class GraphqlModule {}
