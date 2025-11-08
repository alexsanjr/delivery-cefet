import { Module } from '@nestjs/common';
import { OrdersClient } from './orders.client';

@Module({
  providers: [OrdersClient],
  exports: [OrdersClient],
})
export class GrpcModule {}
