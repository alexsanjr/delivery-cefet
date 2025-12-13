import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IRepositorioEndereco } from '../../../domain/repositories/address.repository.interface';
import { Endereco } from '../../../domain/entities/address';

// Adapter: implementa persistência de endereços com Prisma
@Injectable()
export class RepositorioPrismaEndereco implements IRepositorioEndereco {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: number): Promise<Endereco | null> {
    const dados = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!dados) return null;

    return this.paraDominio(dados);
  }

  async buscarPorIdCliente(idCliente: number): Promise<Endereco[]> {
    const dados = await this.prisma.address.findMany({
      where: { customerId: idCliente },
      orderBy: { isPrimary: 'desc' },
    });

    return dados.map((end) => this.paraDominio(end));
  }

  async buscarPrincipalPorIdCliente(
    idCliente: number,
  ): Promise<Endereco | null> {
    const dados = await this.prisma.address.findFirst({
      where: {
        customerId: idCliente,
        isPrimary: true,
      },
    });

    if (!dados) return null;

    return this.paraDominio(dados);
  }

  async salvar(endereco: Endereco): Promise<Endereco> {
    const dados = await this.prisma.address.create({
      data: {
        customerId: endereco.idCliente,
        street: endereco.rua,
        number: endereco.numero,
        complement: endereco.complemento,
        neighborhood: endereco.bairro,
        city: endereco.cidade,
        state: endereco.estado,
        zipCode: endereco.cep.obterValor(),
        latitude: endereco.latitude,
        longitude: endereco.longitude,
        isPrimary: endereco.ehPrincipal,
      },
    });

    return this.paraDominio(dados);
  }

  async atualizar(endereco: Endereco): Promise<Endereco> {
    const dados = await this.prisma.address.update({
      where: { id: endereco.id! },
      data: {
        street: endereco.rua,
        number: endereco.numero,
        complement: endereco.complemento,
        neighborhood: endereco.bairro,
        city: endereco.cidade,
        state: endereco.estado,
        zipCode: endereco.cep.obterValor(),
        latitude: endereco.latitude,
        longitude: endereco.longitude,
        isPrimary: endereco.ehPrincipal,
      },
    });

    return this.paraDominio(dados);
  }

  async excluir(id: number): Promise<void> {
    await this.prisma.address.delete({
      where: { id },
    });
  }

  async existe(id: number): Promise<boolean> {
    const contagem = await this.prisma.address.count({
      where: { id },
    });
    return contagem > 0;
  }

  async desmarcarTodosPrincipais(idCliente: number): Promise<void> {
    await this.prisma.address.updateMany({
      where: {
        customerId: idCliente,
        isPrimary: true,
      },
      data: {
        isPrimary: false,
      },
    });
  }

  /**
   * Converte dados do Prisma para entidade de domínio.
   */
  private paraDominio(dados: any): Endereco {
    return Endereco.reconstituir({
      id: dados.id,
      rua: dados.street,
      numero: dados.number,
      complemento: dados.complement,
      bairro: dados.neighborhood,
      cidade: dados.city,
      estado: dados.state,
      cep: dados.zipCode,
      latitude: dados.latitude,
      longitude: dados.longitude,
      ehPrincipal: dados.isPrimary,
      idCliente: dados.customerId,
      criadoEm: dados.createdAt,
      atualizadoEm: dados.updatedAt,
    });
  }
}
