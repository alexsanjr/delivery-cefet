import { Module, Global } from '@nestjs/common';
import { RoutingModule } from '../routing/routing.module';
import { RoutingGrpcService } from './routing.grpc.service';

/**
 * GrpcModule - Módulo global para serviços gRPC
 * 
 * Este módulo encapsula todos os controllers/services gRPC do MSRouting,
 * seguindo o mesmo padrão do MSCustomers.
 * 
 * @Global - Torna os exports disponíveis em todos os módulos sem necessidade de importação
 */
@Global()
@Module({
  imports: [RoutingModule],
  providers: [RoutingGrpcService],
  exports: [RoutingGrpcService],
})
export class GrpcModule {}
