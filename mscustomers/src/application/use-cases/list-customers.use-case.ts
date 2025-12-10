import { Inject, Injectable } from '@nestjs/common';
import type { IRepositorioCliente } from '../../domain/repositories/customer.repository.interface';
import { TOKEN_REPOSITORIO_CLIENTE } from '../../domain/repositories/injection-tokens';
import { Cliente } from '../../domain/entities/customer.entity';

/**
 * Lista todos os clientes cadastrados.
 */
@Injectable()
export class ListarClientesCasoDeUso {
  constructor(
    @Inject(TOKEN_REPOSITORIO_CLIENTE)
    private readonly repositorioCliente: IRepositorioCliente,
  ) {}

  async executar(): Promise<Cliente[]> {
    return await this.repositorioCliente.buscarTodos();
  }
}
