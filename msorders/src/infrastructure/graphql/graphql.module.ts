import { Module } from '@nestjs/common';
import { ApplicationModule } from '../../application/application.module';
import { OrdersHexagonalResolver } from './resolvers/orders-hexagonal.resolver';

@Module({
  imports: [ApplicationModule],
  providers: [OrdersHexagonalResolver],
  exports: [OrdersHexagonalResolver],
})
export class GraphQLModule {}
