import { Module } from '@nestjs/common';
import { DeliveryPersonsService } from './delivery-persons.service';
import { DeliveryPersonsResolver } from './delivery-persons.resolver';
import { DeliveryPersonsController } from './delivery-persons.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DeliveryPersonsService, DeliveryPersonsResolver],
  controllers: [DeliveryPersonsController],
  exports: [DeliveryPersonsService],
})
export class DeliveryPersonsModule {}
