import { Injectable, Logger, Inject } from '@nestjs/common';
import type { IRepositorioCliente } from '../../../domain/repositories/customer.repository.interface';
import { Cliente } from '../../../domain/entities/customer.entity';

/**
 * Decorator Pattern (GoF)
 *
 * Adiciona funcionalidade de logging ao repositório de clientes
 * sem modificar a implementação original.
 *
 * Benefícios:
 * - Open/Closed Principle: Adiciona funcionalidade sem modificar código existente
 * - Single Responsibility: Logging separado da lógica de persistência
 * - Flexibilidade: Pode ser facilmente adicionado ou removido
 * - Composição: Múltiplos decorators podem ser empilhados
 */
@Injectable()
export class CustomerRepositoryLoggerDecorator implements IRepositorioCliente {
  private readonly logger = new Logger('CustomerRepository');

  constructor(
    @Inject('CUSTOMER_REPOSITORY_BASE')
    private readonly repository: IRepositorioCliente,
  ) {}

  async buscarPorId(id: number): Promise<Cliente | null> {
    this.logger.log(`Buscando cliente com ID: ${id}`);
    const startTime = Date.now();

    try {
      const result = await this.repository.buscarPorId(id);
      const duration = Date.now() - startTime;

      if (result) {
        this.logger.log(`Cliente ID ${id} encontrado em ${duration}ms`);
      } else {
        this.logger.warn(`Cliente ID ${id} não encontrado (${duration}ms)`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(
        `Erro ao buscar cliente ID ${id} após ${duration}ms: ${errorMessage}`,
      );
      throw error;
    }
  }

  async buscarPorEmail(email: string): Promise<Cliente | null> {
    this.logger.log(`Buscando cliente com email: ${email}`);
    const startTime = Date.now();

    try {
      const result = await this.repository.buscarPorEmail(email);
      const duration = Date.now() - startTime;

      if (result) {
        this.logger.log(
          `Cliente com email ${email} encontrado em ${duration}ms`,
        );
      } else {
        this.logger.warn(
          `Cliente com email ${email} não encontrado (${duration}ms)`,
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(
        `Erro ao buscar cliente por email após ${duration}ms: ${errorMessage}`,
      );
      throw error;
    }
  }

  async buscarTodos(): Promise<Cliente[]> {
    this.logger.log('Buscando todos os clientes');
    const startTime = Date.now();

    try {
      const result = await this.repository.buscarTodos();
      const duration = Date.now() - startTime;

      this.logger.log(`${result.length} clientes encontrados em ${duration}ms`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(
        `Erro ao buscar todos os clientes após ${duration}ms: ${errorMessage}`,
      );
      throw error;
    }
  }

  async salvar(cliente: Cliente): Promise<Cliente> {
    this.logger.log(
      `Salvando novo cliente: ${cliente.nome} (${cliente.email.obterValor()})`,
    );
    const startTime = Date.now();

    try {
      const result = await this.repository.salvar(cliente);
      const duration = Date.now() - startTime;

      this.logger.log(
        `Cliente salvo com sucesso - ID: ${result.id} em ${duration}ms`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(
        `Erro ao salvar cliente após ${duration}ms: ${errorMessage}`,
      );
      throw error;
    }
  }

  async atualizar(cliente: Cliente): Promise<Cliente> {
    this.logger.log(`Atualizando cliente ID: ${cliente.id} - ${cliente.nome}`);
    const startTime = Date.now();

    try {
      const result = await this.repository.atualizar(cliente);
      const duration = Date.now() - startTime;

      this.logger.log(
        `Cliente ID ${cliente.id} atualizado com sucesso em ${duration}ms`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(
        `Erro ao atualizar cliente ID ${cliente.id} após ${duration}ms: ${errorMessage}`,
      );
      throw error;
    }
  }

  async excluir(id: number): Promise<void> {
    this.logger.log(`Excluindo cliente ID: ${id}`);
    const startTime = Date.now();

    try {
      await this.repository.excluir(id);
      const duration = Date.now() - startTime;

      this.logger.log(`Cliente ID ${id} excluído com sucesso em ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Erro ao excluir cliente ID ${id} após ${duration}ms: ${error.message}`,
      );
      throw error;
    }
  }

  async existe(id: number): Promise<boolean> {
    this.logger.debug(`Verificando existência do cliente ID: ${id}`);
    const startTime = Date.now();

    try {
      const result = await this.repository.existe(id);
      const duration = Date.now() - startTime;

      this.logger.debug(
        `Cliente ID ${id} ${result ? 'existe' : 'não existe'} (${duration}ms)`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(
        `Erro ao verificar existência do cliente ID ${id} após ${duration}ms: ${errorMessage}`,
      );
      throw error;
    }
  }

  async existePorEmail(email: string): Promise<boolean> {
    this.logger.debug(`Verificando existência do email: ${email}`);
    const startTime = Date.now();

    try {
      const result = await this.repository.existePorEmail(email);
      const duration = Date.now() - startTime;

      this.logger.debug(
        `Email ${email} ${result ? 'existe' : 'não existe'} (${duration}ms)`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(
        `Erro ao verificar existência do email após ${duration}ms: ${errorMessage}`,
      );
      throw error;
    }
  }
}
