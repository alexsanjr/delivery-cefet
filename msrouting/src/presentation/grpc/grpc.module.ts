import { Module } from '@nestjs/common';
import { ApplicationModule } from '../../application/application.module';
import { RoutingGrpcController } from './routing.grpc-service';

// Módulo gRPC para comunicação entre microserviços
@Module({
  imports: [ApplicationModule],
  controllers: [RoutingGrpcController],
})
export class GrpcModule {}
