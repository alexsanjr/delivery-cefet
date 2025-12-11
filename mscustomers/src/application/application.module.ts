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
