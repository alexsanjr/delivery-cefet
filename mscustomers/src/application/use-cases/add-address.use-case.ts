import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IRepositorioCliente } from '../../domain/repositories/customer.repository.interface';
import type { IRepositorioEndereco } from '../../domain/repositories/address.repository.interface';
import { TOKEN_REPOSITORIO_CLIENTE, TOKEN_REPOSITORIO_ENDERECO } from '../../domain/repositories/injection-tokens';
import { Endereco } from '../../domain/entities/address';

/**
 * Adiciona um novo endereço ao cadastro do cliente.
 */
@Injectable()
export class AdicionarEnderecoCasoDeUso {
  constructor(
    @Inject(TOKEN_REPOSITORIO_CLIENTE)
    private readonly repositorioCliente: IRepositorioCliente,
    @Inject(TOKEN_REPOSITORIO_ENDERECO)
    private readonly repositorioEndereco: IRepositorioEndereco,
  ) {}

  async executar(
    idCliente: number,
    dados: {
      rua: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      estado: string;
      cep: string;
      ehPrincipal?: boolean;
    },
  ): Promise<Endereco> {
    // Validar se cliente existe
    const cliente = await this.repositorioCliente.buscarPorId(idCliente);
    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${idCliente} não encontrado`);
    }

    // Criar endereço
    const endereco = Endereco.criar({
      ...dados,
      idCliente,
    });

    // Se for principal, desmarcar outros endereços
    if (endereco.ehPrincipal) {
      await this.repositorioEndereco.desmarcarTodosPrincipais(idCliente);
    }

    // Persistir
    return await this.repositorioEndereco.salvar(endereco);
  }
}
