import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { BuscarClientePorIdCasoDeUso } from '../../application/use-cases/find-customer-by-id.use-case';
import { MapeadorCliente } from '../../application/mappers/customer.mapper';

// Service gRPC: comunicação entre microserviços
@Controller()
export class CustomersGrpcService {
  constructor(
    @Inject(BuscarClientePorIdCasoDeUso)
    private readonly buscarClientePorIdCasoDeUso: BuscarClientePorIdCasoDeUso,
  ) {}

  /**
   * Busca um cliente pelo ID via gRPC
   */
  @GrpcMethod('CustomersService', 'GetCustomer')
  async obterCliente(data: { id: number }) {
    console.log('[gRPC] GetCustomer chamado com id:', data.id);
    
    try {
      const cliente = await this.buscarClientePorIdCasoDeUso.executar(data.id);

      if (!cliente) {
        return { error: 'Cliente não encontrado' };
      }

      const clienteDto = MapeadorCliente.paraDto(cliente);

      return {
        id: clienteDto.id,
        name: clienteDto.nome,
        email: clienteDto.email,
        phone: clienteDto.telefone,
        isPremium: clienteDto.ehPremium,
        addresses: clienteDto.enderecos.map((end) => ({
          id: end.id,
          street: end.rua,
          number: end.numero,
          neighborhood: end.bairro,
          city: end.cidade,
          state: end.estado,
          zipCode: end.cep,
          complement: end.complemento,
          isPrimary: end.ehPrincipal,
          customerId: end.idCliente,
          createdAt: end.criadoEm?.toISOString(),
          latitude: 0,
          longitude: 0,
        })),
        createdAt: clienteDto.criadoEm?.toISOString(),
        updatedAt: clienteDto.atualizadoEm?.toISOString(),
      };
    } catch (error) {
      console.error('[gRPC] Erro ao buscar cliente:', error);
      return { error: 'Erro ao buscar cliente' };
    }
  }

  /**
   * Valida se um cliente existe e está ativo via gRPC
   */
  @GrpcMethod('CustomersService', 'ValidateCustomer')
  async validarCliente(data: { id: number }) {
    try {
      const cliente = await this.buscarClientePorIdCasoDeUso.executar(data.id);

      if (!cliente) {
        return {
          isValid: false,
          message: 'Cliente não encontrado',
          customer: null,
        };
      }

      const clienteDto = MapeadorCliente.paraDto(cliente);

      return {
        isValid: true,
        message: 'Cliente válido',
        customer: {
          id: clienteDto.id,
          name: clienteDto.nome,
          email: clienteDto.email,
          phone: clienteDto.telefone,
          isPremium: clienteDto.ehPremium,
          addresses: [],
          createdAt: clienteDto.criadoEm?.toISOString(),
          updatedAt: clienteDto.atualizadoEm?.toISOString(),
        },
      };
    } catch (error) {
      console.error('[gRPC] Erro ao validar cliente:', error);
      return {
        isValid: false,
        message: 'Erro ao validar cliente',
        customer: null,
      };
    }
  }
}
