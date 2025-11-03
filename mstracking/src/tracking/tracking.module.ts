// src/tracking/tracking.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingService } from './services/tracking.service';
import { TrackingResolver } from './tracking.resolver';
import { TrackingPosition } from './entities/tracking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrackingPosition])],
  providers: [TrackingService, TrackingResolver],
  exports: [TrackingService],
})
export class TrackingModule {}