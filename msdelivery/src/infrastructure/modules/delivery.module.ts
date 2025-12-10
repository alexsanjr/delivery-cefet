import { Module } from '@nestjs/common';
import { DELIVERY_REPOSITORY } from '../../domain/repositories/delivery.repository.interface';
import { DELIVERY_PERSON_REPOSITORY } from '../../domain/repositories/delivery-person.repository.interface';
import { ORDERS_CLIENT } from '../../application/ports/out/orders-client.port';
import { GEOCODING_SERVICE } from '../../application/ports/out/geocoding-service.port';
import { PrismaDeliveryRepository } from '../adapters/out/persistence/prisma-delivery.repository';
import { PrismaDeliveryPersonRepository } from '../adapters/out/persistence/prisma-delivery-person.repository';
import { GrpcOrdersClientAdapter } from '../adapters/out/grpc-clients/grpc-orders-client.adapter';
import { NominatimGeocodingAdapter } from '../adapters/out/geocoding/nominatim-geocoding.adapter';
import { DeliveryGrpcController } from '../adapters/in/grpc/delivery-grpc.controller';
import { 
  CreateDeliveryUseCase,
  GetDeliveryByOrderIdUseCase,
  ListDeliveriesByStatusUseCase,
  ListDeliveriesByDeliveryPersonUseCase,
  AssignDeliveryUseCase,
  UpdateDeliveryStatusUseCase,
} from '../../application/use-cases/delivery';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [DeliveryGrpcController],
  providers: [
    PrismaService,
    // Repositories
    {
      provide: DELIVERY_REPOSITORY,
      useClass: PrismaDeliveryRepository,
    },
    {
      provide: DELIVERY_PERSON_REPOSITORY,
      useClass: PrismaDeliveryPersonRepository,
    },
    // External Clients
    {
      provide: ORDERS_CLIENT,
      useClass: GrpcOrdersClientAdapter,
    },
    {
      provide: GEOCODING_SERVICE,
      useClass: NominatimGeocodingAdapter,
    },
    // Use Cases
    CreateDeliveryUseCase,
    GetDeliveryByOrderIdUseCase,
    ListDeliveriesByStatusUseCase,
    ListDeliveriesByDeliveryPersonUseCase,
    AssignDeliveryUseCase,
    UpdateDeliveryStatusUseCase,
  ],
  exports: [DELIVERY_REPOSITORY],
})
export class DeliveryModule {}
