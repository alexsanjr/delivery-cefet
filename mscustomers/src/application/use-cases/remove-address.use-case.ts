import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IRepositorioEndereco } from '../../domain/repositories/address.repository.interface';
import { TOKEN_REPOSITORIO_ENDERECO } from '../../domain/repositories/injection-tokens';

/**
 * Remove um endereço do cadastro do cliente.
 */
@Injectable()
export class RemoverEnderecoCasoDeUso {
  constructor(
    @Inject(TOKEN_REPOSITORIO_ENDERECO)
    private readonly repositorioEndereco: IRepositorioEndereco,
  ) {}

  async executar(id: number): Promise<void> {
    // Validar se endereço existe
    const existe = await this.repositorioEndereco.existe(id);
    if (!existe) {
      throw new NotFoundException(`Endereço com ID ${id} não encontrado`);
    }

    // Excluir
    await this.repositorioEndereco.excluir(id);
  }
}
