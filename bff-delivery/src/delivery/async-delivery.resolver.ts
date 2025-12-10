import { Resolver, Mutation, Args, Int, ObjectType, Field } from '@nestjs/graphql';
import { DeliveryCommandPublisher } from '../messaging/publishers/delivery-command.publisher';

@ObjectType()
export class AsyncCommandResponse {
  @Field()
  success: boolean;

  @Field()
  correlationId: string;

  @Field()
  message: string;
}

@Resolver()
export class AsyncDeliveryResolver {
  constructor(
    private readonly commandPublisher: DeliveryCommandPublisher,
  ) {}

  @Mutation(() => AsyncCommandResponse, { 
    description: 'Atribuir entrega de forma assíncrona via RabbitMQ (alta performance)' 
  })
  async assignDeliveryAsync(
    @Args('orderId', { type: () => Int }) orderId: number,
    @Args('deliveryPersonId', { type: () => Int, nullable: true }) deliveryPersonId?: number,
  ): Promise<AsyncCommandResponse> {
    try {
      const correlationId = await this.commandPublisher.publishAssignDeliveryCommand({
        orderId,
        deliveryPersonId,
      });

      return {
        success: true,
        correlationId,
        message: `Comando de atribuição de entrega enviado. Acompanhe pelo correlationId: ${correlationId}`,
      };
    } catch (error) {
      return {
        success: false,
        correlationId: '',
        message: `Erro ao enviar comando: ${error.message}`,
      };
    }
  }

  @Mutation(() => AsyncCommandResponse, { 
    description: 'Criar entrega de forma assíncrona via RabbitMQ (alta performance)' 
  })
  async createDeliveryAsync(
    @Args('orderId', { type: () => Int }) orderId: number,
    @Args('customerLatitude') customerLatitude: number,
    @Args('customerLongitude') customerLongitude: number,
    @Args('customerAddress') customerAddress: string,
  ): Promise<AsyncCommandResponse> {
    try {
      const correlationId = await this.commandPublisher.publishCreateDeliveryCommand({
        orderId,
        customerLatitude,
        customerLongitude,
        customerAddress,
      });

      return {
        success: true,
        correlationId,
        message: `Comando de criação de entrega enviado. Acompanhe pelo correlationId: ${correlationId}`,
      };
    } catch (error) {
      return {
        success: false,
        correlationId: '',
        message: `Erro ao enviar comando: ${error.message}`,
      };
    }
  }

  @Mutation(() => AsyncCommandResponse, { 
    description: 'Atualizar status de entrega de forma assíncrona via RabbitMQ (alta performance)' 
  })
  async updateDeliveryStatusAsync(
    @Args('deliveryId', { type: () => Int }) deliveryId: number,
    @Args('status') status: string,
  ): Promise<AsyncCommandResponse> {
    try {
      const correlationId = await this.commandPublisher.publishUpdateDeliveryStatusCommand({
        deliveryId,
        status,
      });

      return {
        success: true,
        correlationId,
        message: `Comando de atualização de status enviado. Acompanhe pelo correlationId: ${correlationId}`,
      };
    } catch (error) {
      return {
        success: false,
        correlationId: '',
        message: `Erro ao enviar comando: ${error.message}`,
      };
    }
  }
}
