import { Module } from '@nestjs/common';
import { ApplicationModule } from '../../application/application.module';
import { OrdersHexagonalResolver } from './resolvers/orders-hexagonal.resolver';
import { ProductModule } from '../../product/product.module';
import { OrdersModule } from '../../orders/orders.module';

@Module({
  imports: [ApplicationModule, ProductModule, OrdersModule],
  providers: [OrdersHexagonalResolver],
  exports: [OrdersHexagonalResolver],
})
export class GraphQLModule {}
