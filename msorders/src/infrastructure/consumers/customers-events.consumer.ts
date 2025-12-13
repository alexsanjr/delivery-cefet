import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';
import * as protobuf from 'protobufjs';

// Cache local de clientes sincronizado via RabbitMQ
interface CustomerCache {
  id: number;
  name: string;
  email: string;
  phone: string;
  isPremium: boolean;
  updatedAt: Date;
}

/**
 * Consumer que escuta eventos de clientes via RabbitMQ + Protobuf
 * Mantém cache local sincronizado para evitar chamadas gRPC
 */
@Injectable()
export class CustomersEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(CustomersEventsConsumer.name);
  private customersCache: Map<number, CustomerCache> = new Map();
  private proto: protobuf.Root | null = null;

  constructor(private readonly rabbitMQ: RabbitMQService) {}

  async onModuleInit() {
    try {
      // Carregar schema Protobuf
      this.proto = await protobuf.load('src/grpc/customers.proto');
      this.logger.log('✅ Protobuf schema carregado para customers');

      // Registrar consumers para eventos de clientes
      await this.rabbitMQ.consume(
        'orders.customers.queue',
        this.handleCustomerEvent.bind(this),
      );

      this.logger.log(
        '✅ Consumer registrado para fila: orders.customers.queue',
      );
    } catch (error) {
      this.logger.error('❌ Erro ao inicializar consumer:', error);
    }
  }

  /**
   * Processa mensagens de eventos de clientes
   */
  private async handleCustomerEvent(msg: any) {
    if (!msg || !this.proto) return;

    const routingKey = msg.fields?.routingKey || '';
    this.logger.log(`📨 Evento recebido: ${routingKey}`);

    // Desserializar Protobuf
    const CustomerResponse = this.proto.lookupType(
      'customers.CustomerResponse',
    );
    const decoded = CustomerResponse.decode(msg.content);
    const customer = CustomerResponse.toObject(decoded) as any;

    // Processar baseado no tipo de evento
    switch (routingKey) {
      case 'customer.created':
        await this.handleCustomerCreated(customer);
        break;
      case 'customer.updated':
        await this.handleCustomerUpdated(customer);
        break;
      case 'customer.deleted':
        await this.handleCustomerDeleted(customer);
        break;
      default:
        this.logger.warn(`⚠️ Evento desconhecido: ${routingKey}`);
    }

    // RabbitMQService faz ack automaticamente
  }

  /**
   * Processa criação de cliente - adiciona ao cache
   */
  private async handleCustomerCreated(customer: any) {
    this.logger.log(`✅ Cliente criado: ${customer.id} - ${customer.name}`);

    this.customersCache.set(customer.id, {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      isPremium: customer.isPremium,
      updatedAt: new Date(customer.updatedAt),
    });

    this.logger.log(`📦 Cache atualizado: ${this.customersCache.size} clientes`);
  }

  /**
   * Processa atualização de cliente - atualiza cache
   */
  private async handleCustomerUpdated(customer: any) {
    this.logger.log(`🔄 Cliente atualizado: ${customer.id} - ${customer.name}`);

    this.customersCache.set(customer.id, {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      isPremium: customer.isPremium,
      updatedAt: new Date(customer.updatedAt),
    });
  }

  /**
   * Processa exclusão de cliente - remove do cache
   */
  private async handleCustomerDeleted(customer: any) {
    this.logger.log(`❌ Cliente deletado: ${customer.id}`);
    this.customersCache.delete(customer.id);
  }

  /**
   * Busca cliente no cache local (sem chamada gRPC)
   */
  getCustomerFromCache(customerId: number): CustomerCache | null {
    return this.customersCache.get(customerId) || null;
  }

  /**
   * Verifica se cliente existe no cache
   */
  hasCustomer(customerId: number): boolean {
    return this.customersCache.has(customerId);
  }

  /**
   * Retorna estatísticas do cache
   */
  getCacheStats() {
    return {
      totalCustomers: this.customersCache.size,
      customers: Array.from(this.customersCache.values()),
    };
  }
}
