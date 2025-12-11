import { Module } from '@nestjs/common';
import { ApplicationModule } from '../../application/application.module';
import { CustomersGrpcService } from './customers.grpc-service';

// Módulo gRPC para comunicação entre microserviços
@Module({
  imports: [ApplicationModule],
  controllers: [CustomersGrpcService],
})
export class GrpcModule {}
