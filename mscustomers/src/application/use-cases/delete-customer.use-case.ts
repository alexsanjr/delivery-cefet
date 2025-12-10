import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IRepositorioCliente } from '../../domain/repositories/customer.repository.interface';
import { TOKEN_REPOSITORIO_CLIENTE } from '../../domain/repositories/injection-tokens';

/**
 * Remove um cliente do sistema.
 */
@Injectable()
export class ExcluirClienteCasoDeUso {
  constructor(
    @Inject(TOKEN_REPOSITORIO_CLIENTE)
    private readonly repositorioCliente: IRepositorioCliente,
  ) {}

  async executar(id: number): Promise<void> {
    // Validar se cliente existe
    const existe = await this.repositorioCliente.existe(id);
    if (!existe) {
      throw new NotFoundException(`Cliente com ID ${id} não encontrado`);
    }

    // Excluir
    await this.repositorioCliente.excluir(id);
  }
}
