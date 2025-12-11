import { Module } from '@nestjs/common';
import { ApplicationModule } from '../../application/application.module';
import { RoutingResolver } from './resolvers/routing.resolver';
import { RoutingEventsConsumer } from '../../infrastructure/messaging/consumers/routing-events.consumer';

// Módulo GraphQL com resolvers e consumer RabbitMQ
@Module({
  imports: [ApplicationModule],
  providers: [RoutingResolver, RoutingEventsConsumer],
  exports: [RoutingResolver],
})
export class GraphQLModule {}
