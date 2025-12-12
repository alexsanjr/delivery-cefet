import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IRepositorioCliente } from '../../domain/repositories/customer.repository.interface';
import { TOKEN_REPOSITORIO_CLIENTE } from '../../domain/repositories/injection-tokens';
import { Cliente } from '../../domain/entities/customer.entity';

// Busca cliente por ID com seus endereços
@Injectable()
export class BuscarClientePorIdCasoDeUso {
  private readonly repositorioCliente: IRepositorioCliente;

  constructor(
    @Inject(TOKEN_REPOSITORIO_CLIENTE)
    repositorioCliente: any,
  ) {
    this.repositorioCliente = repositorioCliente;
  }

  async executar(id: number): Promise<Cliente> {
    const cliente = await this.repositorioCliente.buscarPorId(id);

    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${id} não encontrado`);
    }

    return cliente;
  }
}
