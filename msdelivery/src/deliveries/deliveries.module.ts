import { Module } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesResolver } from './deliveries.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { GrpcModule } from '../grpc/grpc.module';
import { DeliveryPersonsModule } from '../delivery-persons/delivery-persons.module';
import { GeocodingService } from '../utils/geocoding.service';

@Module({
  imports: [PrismaModule, GrpcModule, DeliveryPersonsModule],
  providers: [DeliveriesService, DeliveriesResolver, GeocodingService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
