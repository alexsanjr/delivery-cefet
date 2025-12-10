import { Module } from '@nestjs/common';
import { CustomersGrpcService } from './grpc/customers.grpc-service';
import { BuscarClientePorIdCasoDeUso } from '../application/use-cases/find-customer-by-id.use-case';
import { TOKEN_REPOSITORIO_CLIENTE } from '../domain/repositories/injection-tokens';
import { RepositorioPrismaCliente } from '../infrastructure/persistence/repositories/prisma-customer.repository';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';

// Módulo gRPC: configura comunicação entre microserviços
@Module({
  imports: [PrismaModule],
  controllers: [CustomersGrpcService],
  providers: [
    // Repositórios
    {
      provide: TOKEN_REPOSITORIO_CLIENTE,
      useClass: RepositorioPrismaCliente,
    },
    // Use Cases necessários para gRPC
    BuscarClientePorIdCasoDeUso,
  ],
})
export class GrpcModule {}
