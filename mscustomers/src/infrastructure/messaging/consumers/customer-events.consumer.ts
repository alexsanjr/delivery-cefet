import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';

// Consumer para processar eventos de clientes de outros microserviços
@Injectable()
export class CustomerEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(CustomerEventsConsumer.name);

  constructor(private readonly rabbitMQ: RabbitMQService) {}

  async onModuleInit() {
    // Exemplo: escutar eventos de validação de outros serviços
    await this.consumirValidacaoCliente();
  }

  /**
   * Consome requisições de validação de cliente
   */
  private async consumirValidacaoCliente() {
    await this.rabbitMQ.consume(
      'customer.validation.request',
      'ValidateCustomerRequest',
      async (data) => {
        this.logger.log(`🔍 Validando cliente ID: ${data.id}`);
        
        // Aqui você chamaria seu use case de validação
        // const resultado = await this.validarClienteCasoDeUso.executar(data.id);
        
        // Responder na fila de resposta
        await this.rabbitMQ.publish(
          'customer.validation.response',
          'ValidateCustomerResponse',
          {
            isValid: true,
            message: 'Cliente válido',
            customer: {
              id: data.id,
              name: 'Cliente Exemplo',
              email: 'exemplo@email.com',
              phone: '11999999999',
              isPremium: false,
              addresses: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }
        );
      }
    );
  }
}
