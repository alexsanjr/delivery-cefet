import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../../infrastructure/messaging/rabbitmq.service';
import { Cliente } from '../entities/customer.entity';

// Eventos de domínio para Cliente
@Injectable()
export class ClienteEventPublisher {
  constructor(private readonly rabbitMQ: RabbitMQService) {}

  /**
   * Publica evento quando cliente é criado
   */
  async publicarClienteCriado(cliente: Cliente): Promise<void> {
    const evento = {
      id: cliente.id,
      name: cliente.nome,
      email: cliente.email.obterValor(),
      phone: cliente.telefone.obterValor(),
      isPremium: cliente.ehPremium,
      createdAt: cliente.criadoEm.toISOString(),
      updatedAt: cliente.atualizadoEm.toISOString(),
    };

    await this.rabbitMQ.publish('customer.created', 'CustomerResponse', evento);
  }

  /**
   * Publica evento quando cliente é atualizado
   */
  async publicarClienteAtualizado(cliente: Cliente): Promise<void> {
    const evento = {
      id: cliente.id,
      name: cliente.nome,
      email: cliente.email.obterValor(),
      phone: cliente.telefone.obterValor(),
      isPremium: cliente.ehPremium,
      createdAt: cliente.criadoEm.toISOString(),
      updatedAt: cliente.atualizadoEm.toISOString(),
    };

    await this.rabbitMQ.publish('customer.updated', 'CustomerResponse', evento);
  }

  /**
   * Publica evento quando endereço é adicionado
   */
  async publicarEnderecoAdicionado(
    clienteId: number,
    enderecoId: number,
  ): Promise<void> {
    await this.rabbitMQ.publish('customer.address.added', 'CustomerResponse', {
      id: clienteId,
      addressId: enderecoId,
    });
  }
}
