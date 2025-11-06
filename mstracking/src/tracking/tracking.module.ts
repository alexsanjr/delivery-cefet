import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingService } from './services/tracking.service';
import { TrackingResolver } from './tracking.resolver';
import { TrackingPosition } from './entities/tracking.entity';
import { GrpcModule } from '../grpc/grpc.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrackingPosition]),
    GrpcModule,
  ],
  providers: [TrackingService, TrackingResolver],
  exports: [TrackingService],
})
export class TrackingModule {}