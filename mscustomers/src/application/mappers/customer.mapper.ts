import { Cliente } from '../../domain/entities/customer.entity';
import { Endereco } from '../../domain/entities/address';
import { DtoSaidaCliente, DtoSaidaEndereco } from '../dtos/customer.dto';

// Converte entidades de domínio para DTOs
export class MapeadorCliente {
  static paraDto(cliente: Cliente): DtoSaidaCliente {
    return {
      id: cliente.id!,
      nome: cliente.nome,
      email: cliente.email.obterValor(),
      telefone: cliente.telefone.obterValor(),
      ehPremium: cliente.ehPremium,
      enderecos: MapeadorEndereco.paraDtoLista(cliente.enderecos),
      quantidadeEnderecos: cliente.obterQuantidadeEnderecos(),
      criadoEm: cliente.criadoEm,
      atualizadoEm: cliente.atualizadoEm,
    };
  }

  static paraDtoLista(clientes: Cliente[]): DtoSaidaCliente[] {
    return clientes.map((c) => MapeadorCliente.paraDto(c));
  }
}

export class MapeadorEndereco {
  static paraDto(endereco: Endereco): DtoSaidaEndereco {
    return {
      id: endereco.id!,
      rua: endereco.rua,
      numero: endereco.numero,
      complemento: endereco.complemento,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      estado: endereco.estado,
      cep: endereco.cep.obterValor(),
      latitude: endereco.latitude,
      longitude: endereco.longitude,
      ehPrincipal: endereco.ehPrincipal,
      idCliente: endereco.idCliente,
      criadoEm: endereco.criadoEm,
      atualizadoEm: endereco.atualizadoEm,
    };
  }

  static paraDtoLista(enderecos: Endereco[]): DtoSaidaEndereco[] {
    return enderecos.map((e) => MapeadorEndereco.paraDto(e));
  }
}
