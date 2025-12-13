import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IRepositorioCliente } from '../../../domain/repositories/customer.repository.interface';
import { Cliente } from '../../../domain/entities/customer.entity';
import { Endereco } from '../../../domain/entities/address';
import { Email } from '../../../domain/value-objects/email';
import { Telefone } from '../../../domain/value-objects/phone';
import { Cep } from '../../../domain/value-objects/postal-code';

// Adapter: implementa persistência de clientes com Prisma
@Injectable()
export class RepositorioPrismaCliente implements IRepositorioCliente {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: number): Promise<Cliente | null> {
    const dados = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: {
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    if (!dados) return null;

    return this.paraDominio(dados);
  }

  async buscarPorEmail(email: string): Promise<Cliente | null> {
    const dados = await this.prisma.customer.findUnique({
      where: { email },
      include: {
        addresses: {
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    if (!dados) return null;

    return this.paraDominio(dados);
  }

  async buscarTodos(): Promise<Cliente[]> {
    const dados = await this.prisma.customer.findMany({
      include: {
        addresses: {
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    return dados.map((cliente) => this.paraDominio(cliente));
  }

  async salvar(cliente: Cliente): Promise<Cliente> {
    const dados = await this.prisma.customer.create({
      data: {
        name: cliente.nome,
        email: cliente.email.obterValor(),
        phone: cliente.telefone.obterValor(),
        isPremium: cliente.ehPremium,
      },
      include: {
        addresses: true,
      },
    });

    return this.paraDominio(dados);
  }

  async atualizar(cliente: Cliente): Promise<Cliente> {
    const dados = await this.prisma.customer.update({
      where: { id: cliente.id! },
      data: {
        name: cliente.nome,
        email: cliente.email.obterValor(),
        phone: cliente.telefone.obterValor(),
        isPremium: cliente.ehPremium,
      },
      include: {
        addresses: {
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    return this.paraDominio(dados);
  }

  async excluir(id: number): Promise<void> {
    await this.prisma.customer.delete({
      where: { id },
    });
  }

  async existe(id: number): Promise<boolean> {
    const contagem = await this.prisma.customer.count({
      where: { id },
    });
    return contagem > 0;
  }

  async existePorEmail(email: string): Promise<boolean> {
    const contagem = await this.prisma.customer.count({
      where: { email },
    });
    return contagem > 0;
  }

  /**
   * Converte dados do Prisma para entidade de domínio.
   */
  private paraDominio(dados: any): Cliente {
    const enderecos = (dados.addresses || []).map((end: any) =>
      Endereco.reconstituir({
        id: end.id,
        rua: end.street,
        numero: end.number,
        complemento: end.complement,
        bairro: end.neighborhood,
        cidade: end.city,
        estado: end.state,
        cep: end.zipCode,
        latitude: end.latitude,
        longitude: end.longitude,
        ehPrincipal: end.isPrimary,
        idCliente: end.customerId,
        criadoEm: end.createdAt,
        atualizadoEm: end.updatedAt,
      }),
    );

    return Cliente.reconstituir({
      id: dados.id,
      nome: dados.name,
      email: dados.email,
      telefone: dados.phone,
      enderecos: enderecos,
      ehPremium: dados.isPremium,
      criadoEm: dados.createdAt,
      atualizadoEm: dados.updatedAt,
    });
  }
}
