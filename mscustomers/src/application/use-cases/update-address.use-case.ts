import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IRepositorioEndereco } from '../../domain/repositories/address.repository.interface';
import { TOKEN_REPOSITORIO_ENDERECO } from '../../domain/repositories/injection-tokens';
import { Endereco } from '../../domain/entities/address';

/**
 * Atualiza os dados de um endereço existente.
 */
@Injectable()
export class AtualizarEnderecoCasoDeUso {
  constructor(
    @Inject(TOKEN_REPOSITORIO_ENDERECO)
    private readonly repositorioEndereco: IRepositorioEndereco,
  ) {}

  async executar(
    id: number,
    dados: {
      rua?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      cidade?: string;
      estado?: string;
      cep?: string;
      ehPrincipal?: boolean;
    },
  ): Promise<Endereco> {
    // Buscar endereço existente
    const endereco = await this.repositorioEndereco.buscarPorId(id);
    if (!endereco) {
      throw new NotFoundException(`Endereço com ID ${id} não encontrado`);
    }

    // Se estiver marcando como principal, desmarcar outros
    if (dados.ehPrincipal && !endereco.ehPrincipal) {
      await this.repositorioEndereco.desmarcarTodosPrincipais(
        endereco.idCliente,
      );
    }

    // Atualizar
    endereco.atualizar(dados);

    // Persistir
    return await this.repositorioEndereco.atualizar(endereco);
  }
}
