import { Module } from '@nestjs/common';
import { DeliveryPersonsService } from './delivery-persons.service';
import { DeliveryPersonsResolver } from './delivery-persons.resolver';
import { DeliveryPersonsController } from './delivery-persons.controller';
import { DeliveryPersonsGrpcController } from './delivery-persons-grpc.controller';
import { DeliveryPersonValidationService } from './services/delivery-person-validation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    DeliveryPersonsService,
    DeliveryPersonsResolver,
    DeliveryPersonValidationService,
  ],
  controllers: [DeliveryPersonsController, DeliveryPersonsGrpcController],
  exports: [DeliveryPersonsService],
})
export class DeliveryPersonsModule {}
