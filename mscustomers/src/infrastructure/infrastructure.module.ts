import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RabbitMQModule } from './messaging/rabbitmq.module';

// Repositories
import { RepositorioPrismaCliente } from './persistence/repositories/prisma-customer.repository';
import { RepositorioPrismaEndereco } from './persistence/repositories/prisma-address.repository';
import { TOKEN_REPOSITORIO_CLIENTE, TOKEN_REPOSITORIO_ENDERECO } from '../domain/repositories/injection-tokens';

// Domain Events
import { ClienteEventPublisher } from '../domain/events/customer-event.publisher';

/**
 * Infrastructure Module: Camada de Infraestrutura
 * Contém implementações de adapters (Prisma, RabbitMQ, Repositories)
 */
@Module({
  imports: [PrismaModule, RabbitMQModule],
  providers: [
    {
      provide: TOKEN_REPOSITORIO_CLIENTE,
      useClass: RepositorioPrismaCliente,
    },
    {
      provide: TOKEN_REPOSITORIO_ENDERECO,
      useClass: RepositorioPrismaEndereco,
    },
    ClienteEventPublisher,
  ],
  exports: [
    TOKEN_REPOSITORIO_CLIENTE,
    TOKEN_REPOSITORIO_ENDERECO,
    ClienteEventPublisher,
    PrismaModule,
    RabbitMQModule,
  ],
})
export class InfrastructureModule {}
