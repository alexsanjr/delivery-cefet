import { Module } from '@nestjs/common';
import { GrpcCustomersService } from './customers.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GrpcCustomersService],
  exports: [GrpcCustomersService],
})
export class GrpcModule {}
