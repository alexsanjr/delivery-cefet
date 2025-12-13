import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

// Use Cases
import { BuscarClientePorIdCasoDeUso } from './use-cases/find-customer-by-id.use-case';
import { CriarClienteCasoDeUso } from './use-cases/create-customer.use-case';
import { AtualizarClienteCasoDeUso } from './use-cases/update-customer.use-case';
import { ExcluirClienteCasoDeUso } from './use-cases/delete-customer.use-case';
import { ListarClientesCasoDeUso } from './use-cases/list-customers.use-case';
import { AdicionarEnderecoCasoDeUso } from './use-cases/add-address.use-case';
import { AtualizarEnderecoCasoDeUso } from './use-cases/update-address.use-case';
import { RemoverEnderecoCasoDeUso } from './use-cases/remove-address.use-case';

// RabbitMQ Consumers
import { CustomersRequestConsumer } from '../infrastructure/messaging/customers-request.consumer';

/**
 * Application Module: Camada de Aplicação
 * Contém todos os casos de uso que orquestram a lógica de negócio
 */
@Module({
  imports: [InfrastructureModule],
  providers: [
    BuscarClientePorIdCasoDeUso,
    CriarClienteCasoDeUso,
    AtualizarClienteCasoDeUso,
    ExcluirClienteCasoDeUso,
    ListarClientesCasoDeUso,
    AdicionarEnderecoCasoDeUso,
    AtualizarEnderecoCasoDeUso,
    RemoverEnderecoCasoDeUso,
    CustomersRequestConsumer,
  ],
  exports: [
    BuscarClientePorIdCasoDeUso,
    CriarClienteCasoDeUso,
    AtualizarClienteCasoDeUso,
    ExcluirClienteCasoDeUso,
    ListarClientesCasoDeUso,
    AdicionarEnderecoCasoDeUso,
    AtualizarEnderecoCasoDeUso,
    RemoverEnderecoCasoDeUso,
  ],
})
export class ApplicationModule {}
