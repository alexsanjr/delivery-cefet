import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type { IRepositorioCliente } from '../../domain/repositories/customer.repository.interface';
import { TOKEN_REPOSITORIO_CLIENTE } from '../../domain/repositories/injection-tokens';
import { Cliente } from '../../domain/entities/customer.entity';

/**
 * Atualiza os dados de um cliente existente.
 */
@Injectable()
export class AtualizarClienteCasoDeUso {
  constructor(
    @Inject(TOKEN_REPOSITORIO_CLIENTE)
    private readonly repositorioCliente: IRepositorioCliente,
  ) {}

  async executar(
    id: number,
    dados: {
      nome?: string;
      email?: string;
      telefone?: string;
      ehPremium?: boolean;
    },
  ): Promise<Cliente> {
    // Buscar cliente existente
    const cliente = await this.repositorioCliente.buscarPorId(id);
    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${id} não encontrado`);
    }

    // Validar se novo email já está em uso por outro cliente
    if (dados.email && dados.email !== cliente.email.obterValor()) {
      const emailEmUso = await this.repositorioCliente.existePorEmail(dados.email);
      if (emailEmUso) {
        throw new ConflictException('Email já está em uso por outro cliente');
      }
    }

    // Atualizar dados do cliente
    cliente.atualizar(dados);

    // Persistir
    return await this.repositorioCliente.atualizar(cliente);
  }
}
