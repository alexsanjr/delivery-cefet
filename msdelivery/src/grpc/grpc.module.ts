import { Module, forwardRef } from '@nestjs/common';
import { OrdersClient } from './orders.client';
import { DeliveryGrpcController } from './delivery-grpc.controller';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { DeliveryPersonsModule } from '../delivery-persons/delivery-persons.module';

@Module({
  imports: [forwardRef(() => DeliveriesModule), DeliveryPersonsModule],
  controllers: [DeliveryGrpcController],
  providers: [OrdersClient],
  exports: [OrdersClient],
})
export class GrpcModule {}
