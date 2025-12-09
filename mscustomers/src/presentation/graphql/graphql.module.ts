import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { RabbitMQModule } from '../../infrastructure/messaging/rabbitmq.module';

// Resolvers
import { CustomersResolver } from './resolvers/customers.resolver';

// Use Cases
import { BuscarClientePorIdCasoDeUso } from '../../application/use-cases/find-customer-by-id.use-case';
import { CriarClienteCasoDeUso } from '../../application/use-cases/create-customer.use-case';
import { AtualizarClienteCasoDeUso } from '../../application/use-cases/update-customer.use-case';
import { ExcluirClienteCasoDeUso } from '../../application/use-cases/delete-customer.use-case';
import { ListarClientesCasoDeUso } from '../../application/use-cases/list-customers.use-case';
import { AdicionarEnderecoCasoDeUso } from '../../application/use-cases/add-address.use-case';
import { AtualizarEnderecoCasoDeUso } from '../../application/use-cases/update-address.use-case';
import { RemoverEnderecoCasoDeUso } from '../../application/use-cases/remove-address.use-case';

// Repositories
import { RepositorioPrismaCliente } from '../../infrastructure/persistence/repositories/prisma-customer.repository';
import { RepositorioPrismaEndereco } from '../../infrastructure/persistence/repositories/prisma-address.repository';
import { TOKEN_REPOSITORIO_CLIENTE, TOKEN_REPOSITORIO_ENDERECO } from '../../domain/repositories/injection-tokens';

// Events
import { ClienteEventPublisher } from '../../domain/events/customer-event.publisher';
import { CustomerEventsConsumer } from '../../infrastructure/messaging/consumers/customer-events.consumer';

// Módulo GraphQL: configura DI e conecta todas as camadas
@Module({
  imports: [PrismaModule, RabbitMQModule],
  providers: [
    // Resolvers
    CustomersResolver,

    // Use Cases - Application Layer
    BuscarClientePorIdCasoDeUso,
    CriarClienteCasoDeUso,
    AtualizarClienteCasoDeUso,
    ExcluirClienteCasoDeUso,
    ListarClientesCasoDeUso,
    AdicionarEnderecoCasoDeUso,
    AtualizarEnderecoCasoDeUso,
    RemoverEnderecoCasoDeUso,

    // Events - Domain Layer
    ClienteEventPublisher,
    CustomerEventsConsumer,

    // Repositories - Infrastructure Layer (Adaptadores)
    {
      provide: TOKEN_REPOSITORIO_CLIENTE,
      useClass: RepositorioPrismaCliente,
    },
    {
      provide: TOKEN_REPOSITORIO_ENDERECO,
      useClass: RepositorioPrismaEndereco,
    },
  ],
  exports: [
    // Exportar use cases caso outros módulos precisem
    BuscarClientePorIdCasoDeUso,
    ListarClientesCasoDeUso,
  ],
})
export class GraphqlModule {}
