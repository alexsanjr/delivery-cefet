import { Cliente } from '../entities/customer.entity';

/**
 * Define as operações de persistência para clientes.
 * 
 * Esta interface atua como uma porta na arquitetura hexagonal,
 * permitindo que diferentes tecnologias de banco de dados sejam utilizadas.
 */
export interface IRepositorioCliente {
  buscarPorId(id: number): Promise<Cliente | null>;
  buscarPorEmail(email: string): Promise<Cliente | null>;
  buscarTodos(): Promise<Cliente[]>;
  salvar(cliente: Cliente): Promise<Cliente>;
  atualizar(cliente: Cliente): Promise<Cliente>;
  excluir(id: number): Promise<void>;
  existe(id: number): Promise<boolean>;
  existePorEmail(email: string): Promise<boolean>;
}
