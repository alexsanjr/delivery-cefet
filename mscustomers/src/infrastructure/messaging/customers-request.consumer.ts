import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../messaging/rabbitmq.service';
import { BuscarClientePorIdCasoDeUso } from '../../application/use-cases/find-customer-by-id.use-case';
import { MapeadorCliente } from '../../application/mappers/customer.mapper';
import { Inject } from '@nestjs/common';
import * as protobuf from 'protobufjs';

@Injectable()
export class CustomersRequestConsumer implements OnModuleInit {
  private readonly logger = new Logger(CustomersRequestConsumer.name);
  private proto: protobuf.Root | null = null;

  constructor(
    private readonly rabbitMQ: RabbitMQService,
    @Inject(BuscarClientePorIdCasoDeUso)
    private readonly buscarClientePorIdCasoDeUso: BuscarClientePorIdCasoDeUso,
  ) {}

  async onModuleInit() {
    try {
      this.proto = await protobuf.load(
        'src/presentation/grpc/proto/customers.proto',
      );
      this.logger.log('Protobuf schema loaded');

      await this.rabbitMQ.consume(
        'customers.validate.queue',
        'ValidateCustomerRequest',
        this.handleValidateCustomer.bind(this),
      );

      await this.rabbitMQ.consume(
        'customers.get.queue',
        'GetCustomerRequest',
        this.handleGetCustomer.bind(this),
      );

      this.logger.log('RabbitMQ consumers registered');
    } catch (error) {
      this.logger.error('Failed to init request consumer:', error);
    }
  }

  private async handleValidateCustomer(data: any): Promise<any> {
    try {
      this.logger.debug(`Validating customer ${data.id}`);

      const cliente = await this.buscarClientePorIdCasoDeUso.executar(data.id);

      if (!cliente) {
        return {
          isValid: false,
          message: 'Customer not found',
          customer: null,
        };
      }

      const clienteDto = MapeadorCliente.paraDto(cliente);

      return {
        isValid: true,
        message: 'Customer valid',
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
      this.logger.error('Error validating customer:', error);
      return {
        isValid: false,
        message: 'Error validating customer',
        customer: null,
      };
    }
  }

  private async handleGetCustomer(data: any): Promise<any> {
    try {
      this.logger.debug(`Fetching customer data ${data.id}`);

      const cliente = await this.buscarClientePorIdCasoDeUso.executar(data.id);

      if (!cliente) {
        return { error: 'Customer not found' };
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
          latitude: end.latitude,
          longitude: end.longitude,
        })),
        createdAt: clienteDto.criadoEm?.toISOString(),
        updatedAt: clienteDto.atualizadoEm?.toISOString(),
      };
    } catch (error) {
      this.logger.error('Error fetching customer:', error);
      return { error: 'Error fetching customer' };
    }
  }
}
