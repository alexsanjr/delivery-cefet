import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { DeliveryPersonsModule } from './delivery-persons/delivery-persons.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { GrpcModule } from './grpc/grpc.module';

@Module({
  imports: [
    PrismaModule,
    GrpcModule,
    DeliveryPersonsModule,
    DeliveriesModule,
  ],
})
export class AppModule {}
