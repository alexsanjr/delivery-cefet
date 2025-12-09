import { Module } from '@nestjs/common';
import { DELIVERY_PERSON_REPOSITORY } from '../../domain/repositories/delivery-person.repository.interface';
import { PrismaDeliveryPersonRepository } from '../adapters/out/persistence/prisma-delivery-person.repository';
import { DeliveryPersonGrpcController } from '../adapters/in/grpc/delivery-person-grpc.controller';
import { 
  CreateDeliveryPersonUseCase,
  ListDeliveryPersonsUseCase,
  GetDeliveryPersonUseCase,
  UpdateDeliveryPersonUseCase,
  DeleteDeliveryPersonUseCase,
  UpdateDeliveryPersonStatusUseCase,
  UpdateDeliveryPersonLocationUseCase,
  ToggleDeliveryPersonActiveUseCase,
  FindAvailableDeliveryPersonsUseCase,
} from '../../application/use-cases/delivery-person';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [DeliveryPersonGrpcController],
  providers: [
    PrismaService,
    // Repository
    {
      provide: DELIVERY_PERSON_REPOSITORY,
      useClass: PrismaDeliveryPersonRepository,
    },
    // Use Cases
    CreateDeliveryPersonUseCase,
    ListDeliveryPersonsUseCase,
    GetDeliveryPersonUseCase,
    UpdateDeliveryPersonUseCase,
    DeleteDeliveryPersonUseCase,
    UpdateDeliveryPersonStatusUseCase,
    UpdateDeliveryPersonLocationUseCase,
    ToggleDeliveryPersonActiveUseCase,
    FindAvailableDeliveryPersonsUseCase,
  ],
  exports: [
    DELIVERY_PERSON_REPOSITORY,
    GetDeliveryPersonUseCase,
    UpdateDeliveryPersonStatusUseCase,
  ],
})
export class DeliveryPersonModule {}
