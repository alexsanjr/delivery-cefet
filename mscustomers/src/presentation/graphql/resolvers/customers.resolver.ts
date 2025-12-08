import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ClienteType, EnderecoType } from '../types/customer.type';
import {
  CriarClienteInput,
  AtualizarClienteInput,
  CriarEnderecoInput,
  AtualizarEnderecoInput,
} from '../inputs/customer.input';
import { MapeadorCliente, MapeadorEndereco } from '../../../application/mappers/customer.mapper';
import { BuscarClientePorIdCasoDeUso } from '../../../application/use-cases/find-customer-by-id.use-case';
import { CriarClienteCasoDeUso } from '../../../application/use-cases/create-customer.use-case';
import { AtualizarClienteCasoDeUso } from '../../../application/use-cases/update-customer.use-case';
import { ExcluirClienteCasoDeUso } from '../../../application/use-cases/delete-customer.use-case';
import { ListarClientesCasoDeUso } from '../../../application/use-cases/list-customers.use-case';
import { AdicionarEnderecoCasoDeUso } from '../../../application/use-cases/add-address.use-case';
import { AtualizarEnderecoCasoDeUso } from '../../../application/use-cases/update-address.use-case';
import { RemoverEnderecoCasoDeUso } from '../../../application/use-cases/remove-address.use-case';

// Resolver GraphQL: expõe queries e mutations de clientes
@Resolver(() => ClienteType)
export class CustomersResolver {
  constructor(
    private readonly buscarClientePorIdCasoDeUso: BuscarClientePorIdCasoDeUso,
    private readonly criarClienteCasoDeUso: CriarClienteCasoDeUso,
    private readonly atualizarClienteCasoDeUso: AtualizarClienteCasoDeUso,
    private readonly excluirClienteCasoDeUso: ExcluirClienteCasoDeUso,
    private readonly listarClientesCasoDeUso: ListarClientesCasoDeUso,
    private readonly adicionarEnderecoCasoDeUso: AdicionarEnderecoCasoDeUso,
    private readonly atualizarEnderecoCasoDeUso: AtualizarEnderecoCasoDeUso,
    private readonly removerEnderecoCasoDeUso: RemoverEnderecoCasoDeUso,
  ) {}

  @Query(() => ClienteType, { name: 'cliente' })
  async buscarCliente(@Args('id', { type: () => Int }) id: number) {
    const clienteEncontrado = await this.buscarClientePorIdCasoDeUso.executar(id);
    return MapeadorCliente.paraDto(clienteEncontrado);
  }

  @Query(() => [ClienteType], { name: 'clientes' })
  async listarClientes() {
    const listaClientes = await this.listarClientesCasoDeUso.executar();
    return MapeadorCliente.paraDtoLista(listaClientes);
  }

  @Mutation(() => ClienteType)
  async criarCliente(@Args('dados') dados: CriarClienteInput) {
    const clienteCriado = await this.criarClienteCasoDeUso.executar(dados);
    return MapeadorCliente.paraDto(clienteCriado);
  }

  @Mutation(() => ClienteType)
  async atualizarCliente(
    @Args('id', { type: () => Int }) id: number,
    @Args('dados') dados: AtualizarClienteInput,
  ) {
    const clienteAtualizado = await this.atualizarClienteCasoDeUso.executar(id, dados);
    return MapeadorCliente.paraDto(clienteAtualizado);
  }

  @Mutation(() => Boolean)
  async excluirCliente(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
    await this.excluirClienteCasoDeUso.executar(id);
    return true;
  }

  @Mutation(() => EnderecoType)
  async adicionarEndereco(@Args('dados') dados: CriarEnderecoInput) {
    const enderecoAdicionado = await this.adicionarEnderecoCasoDeUso.executar(dados.idCliente, dados);
    return MapeadorEndereco.paraDto(enderecoAdicionado);
  }

  @Mutation(() => EnderecoType)
  async atualizarEndereco(
    @Args('id', { type: () => Int }) id: number,
    @Args('dados') dados: AtualizarEnderecoInput,
  ) {
    const enderecoAtualizado = await this.atualizarEnderecoCasoDeUso.executar(id, dados);
    return MapeadorEndereco.paraDto(enderecoAtualizado);
  }

  @Mutation(() => Boolean)
  async removerEndereco(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
    await this.removerEnderecoCasoDeUso.executar(id);
    return true;
  }
}
