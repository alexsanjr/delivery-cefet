import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import * as protobuf from 'protobufjs';

/**
 * Cliente RabbitMQ para comunicação com MSCustomers
 * Substitui gRPC por RabbitMQ + Protobuf (Request-Reply Pattern)
 */
@Injectable()
export class CustomersRabbitMQClient implements OnModuleInit {
  private readonly logger = new Logger(CustomersRabbitMQClient.name);
  private proto: protobuf.Root | null = null;

  constructor(private readonly rabbitMQ: RabbitMQService) {}

  async onModuleInit() {
    // Carregar schema Protobuf
    this.proto = await protobuf.load('src/grpc/customers.proto');
    this.logger.log('✅ Protobuf schema carregado para customers RabbitMQ client');
  }

  /**
   * Valida se um cliente existe via RabbitMQ (Request-Reply)
   * @param customerId ID do cliente
   * @returns Validação do cliente
   */
  async validateCustomer(customerId: number): Promise<{
    isValid: boolean;
    message: string;
    customer: any | null;
  }> {
    try {
      if (!this.proto) {
        throw new Error('Protobuf não inicializado');
      }

      this.logger.log(`📤 Solicitando validação de cliente ${customerId} via RabbitMQ`);

      // Criar mensagem de request
      const ValidateCustomerRequest = this.proto.lookupType(
        'customers.ValidateCustomerRequest',
      );
      const message = ValidateCustomerRequest.create({ id: customerId });
      const buffer = Buffer.from(ValidateCustomerRequest.encode(message).finish());

      // Enviar via RabbitMQ RPC (Request-Reply)
      const responseBuffer = await this.rabbitMQ.rpcCall(
        'customers.validate.queue',
        buffer,
        5000, // 5 segundos timeout
      );

      // Desserializar resposta
      const ValidateCustomerResponse = this.proto.lookupType(
        'customers.ValidateCustomerResponse',
      );
      const decoded = ValidateCustomerResponse.decode(responseBuffer);
      const response = ValidateCustomerResponse.toObject(decoded) as any;

      this.logger.log(
        `✅ Validação recebida: ${response.isValid} - ${response.message}`,
      );

      return {
        isValid: response.isValid,
        message: response.message,
        customer: response.customer,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao validar cliente via RabbitMQ:`, error);
      throw new Error(`Erro ao validar cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Busca dados completos de um cliente via RabbitMQ (Request-Reply)
   * @param customerId ID do cliente
   * @returns Dados do cliente
   */
  async getCustomer(customerId: number): Promise<any> {
    try {
      if (!this.proto) {
        throw new Error('Protobuf não inicializado');
      }

      this.logger.log(`📤 Solicitando dados do cliente ${customerId} via RabbitMQ`);

      // Criar mensagem de request
      const GetCustomerRequest = this.proto.lookupType(
        'customers.GetCustomerRequest',
      );
      const message = GetCustomerRequest.create({ id: customerId });
      const buffer = Buffer.from(GetCustomerRequest.encode(message).finish());

      // Enviar via RabbitMQ RPC (Request-Reply)
      const responseBuffer = await this.rabbitMQ.rpcCall(
        'customers.get.queue',
        buffer,
        5000, // 5 segundos timeout
      );

      // Desserializar resposta
      const CustomerResponse = this.proto.lookupType(
        'customers.CustomerResponse',
      );
      const decoded = CustomerResponse.decode(responseBuffer);
      const response = CustomerResponse.toObject(decoded) as any;

      if (response.error) {
        throw new Error(response.error);
      }

      this.logger.log(`✅ Dados do cliente recebidos: ${response.name}`);

      return response;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar cliente via RabbitMQ:`, error);
      throw new Error(`Erro ao buscar cliente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}
