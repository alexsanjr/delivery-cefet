import { Module } from '@nestjs/common';
import { DeliveryPersonsService } from './delivery-persons.service';
import { DeliveryPersonsGrpcController } from './delivery-persons-grpc.controller';
import { DeliveryPersonValidationService } from './services/delivery-person-validation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    DeliveryPersonsService,
    DeliveryPersonValidationService,
  ],
  controllers: [DeliveryPersonsGrpcController],
  exports: [DeliveryPersonsService],
})
export class DeliveryPersonsModule {}
