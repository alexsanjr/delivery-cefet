import { Module } from '@nestjs/common';
import { GrpcOrdersService } from './orders-grpc.controller';
import { CustomerDataEnricherService } from './services/customer-data-enricher.service';
import { OrderResponseMapperService } from './services/order-response-mapper.service';
import { OrderRepositoryAdapter } from './adapters/order-repository.adapter';
import { OrdersDatasource } from '../orders/orders.datasource';
import { GrpcModule } from './grpc.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [GrpcModule],
  controllers: [GrpcOrdersService],
  providers: [
    PrismaService,
    OrdersDatasource,

    // Provider com token de interface para IOrderRepository
    {
      provide: 'IOrderRepository',
      useClass: OrderRepositoryAdapter,
    },

    // Provider com token de interface para ICustomerDataEnricher
    {
      provide: 'ICustomerDataEnricher',
      useClass: CustomerDataEnricherService,
    },

    // Provider com token de interface para IOrderResponseMapper
    {
      provide: 'IOrderResponseMapper',
      useClass: OrderResponseMapperService,
    },
  ],
  exports: [
    'IOrderRepository',
    'ICustomerDataEnricher',
    'IOrderResponseMapper',
  ],
})
export class GrpcOrdersModule {}
