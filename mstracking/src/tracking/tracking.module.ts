import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingService } from './services/tracking.service';
import { TrackingResolver } from './tracking.resolver';
import { TrackingPosition } from './entities/tracking.entity';
import { GrpcModule } from '../grpc/grpc.module';
import { TrackingGrpcService } from '../grpc/tracking.grpc.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrackingPosition]),
    GrpcModule,
  ],
  providers: [TrackingService, TrackingResolver, TrackingGrpcService],
  exports: [TrackingService],
})
export class TrackingModule {}