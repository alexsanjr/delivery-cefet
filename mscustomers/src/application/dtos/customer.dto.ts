// DTOs para transferência de dados entre camadas

export interface DtoEntradaCriarCliente {
  nome: string;
  email: string;
  telefone: string;
  ehPremium?: boolean;
}

export interface DtoEntradaAtualizarCliente {
  id: number;
  nome?: string;
  email?: string;
  telefone?: string;
}

export interface DtoSaidaCliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  ehPremium: boolean;
  enderecos: DtoSaidaEndereco[];
  quantidadeEnderecos: number;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface DtoEntradaCriarEndereco {
  idCliente: number;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  ehPrincipal?: boolean;
}

export interface DtoEntradaAtualizarEndereco {
  id: number;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface DtoSaidaEndereco {
  id: number;
  rua: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude: number | null;
  longitude: number | null;
  ehPrincipal: boolean;
  idCliente: number;
  criadoEm: Date;
  atualizadoEm: Date;
}
