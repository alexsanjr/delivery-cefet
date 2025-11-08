import { Module } from '@nestjs/common';
import { DeliveryGrpcController } from './delivery-grpc.controller';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { DeliveryPersonsModule } from '../delivery-persons/delivery-persons.module';

@Module({
  imports: [DeliveriesModule, DeliveryPersonsModule],
  controllers: [DeliveryGrpcController],
})
export class DeliveryGrpcModule {}
