import { Module } from '@nestjs/common';
import { ORDER_REPOSITORY } from '../../domain/repositories/order.repository.interface';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaOrderRepository } from '../persistence/repositories/prisma-order.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: ORDER_REPOSITORY,
      useClass: PrismaOrderRepository,
    },
  ],
  exports: [ORDER_REPOSITORY],
})
export class PersistenceModule {}
