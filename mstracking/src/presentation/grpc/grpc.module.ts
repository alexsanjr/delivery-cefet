import { Module } from '@nestjs/common';
import { TrackingGrpcController } from './tracking-grpc.controller';
import { TrackingApplicationModule } from '../../application/application.module';

@Module({
  imports: [TrackingApplicationModule],
  controllers: [TrackingGrpcController],
})
export class GrpcPresentationModule {}
