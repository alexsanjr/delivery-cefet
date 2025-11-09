import { Module, Global } from '@nestjs/common';
import { RoutingModule } from '../routing/routing.module';
import { RoutingGrpcService } from './routing.grpc.service';

@Global()
@Module({
  imports: [RoutingModule],
  providers: [RoutingGrpcService],
  exports: [RoutingGrpcService],
})
export class GrpcModule {}
