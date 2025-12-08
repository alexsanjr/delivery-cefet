import { Inject, Injectable, ConflictException } from '@nestjs/common';
import type { IRepositorioCliente } from '../../domain/repositories/customer.repository.interface';
import { TOKEN_REPOSITORIO_CLIENTE } from '../../domain/repositories/injection-tokens';
import { Cliente } from '../../domain/entities/customer.entity';

/**
 * Cria um novo cliente no sistema.
 * 
 * Valida se o email já está cadastrado antes de criar o cliente.
 */
@Injectable()
export class CriarClienteCasoDeUso {
  constructor(
    @Inject(TOKEN_REPOSITORIO_CLIENTE)
    private readonly repositorioCliente: IRepositorioCliente,
  ) {}

  async executar(dados: {
    nome: string;
    email: string;
    telefone: string;
  }): Promise<Cliente> {
    // Validar se email já existe
    const emailExiste = await this.repositorioCliente.existePorEmail(dados.email);
    if (emailExiste) {
      throw new ConflictException('Email já cadastrado no sistema');
    }

    // Criar entidade de domínio
    const cliente = Cliente.criar({
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
    });

    // Persistir
    return await this.repositorioCliente.salvar(cliente);
  }
}
