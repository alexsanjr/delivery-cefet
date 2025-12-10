import { Module, forwardRef } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GrpcModule } from '../grpc/grpc.module';

@Module({
  imports: [PrismaModule, forwardRef(() => GrpcModule)],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
