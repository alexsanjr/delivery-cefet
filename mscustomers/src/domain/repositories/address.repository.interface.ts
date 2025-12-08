import { Endereco } from '../entities/address';

/**
 * Define as operações de persistência para endereços.
 */
export interface IRepositorioEndereco {
  buscarPorId(id: number): Promise<Endereco | null>;
  buscarPorIdCliente(idCliente: number): Promise<Endereco[]>;
  buscarPrincipalPorIdCliente(idCliente: number): Promise<Endereco | null>;
  salvar(endereco: Endereco): Promise<Endereco>;
  atualizar(endereco: Endereco): Promise<Endereco>;
  excluir(id: number): Promise<void>;
  existe(id: number): Promise<boolean>;
  desmarcarTodosPrincipais(idCliente: number): Promise<void>;
}
