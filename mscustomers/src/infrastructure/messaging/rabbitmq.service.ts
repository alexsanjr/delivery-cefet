import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import * as protobuf from 'protobufjs';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private proto: protobuf.Root | null = null;

  async onModuleInit() {
    try {
      // Conectar ao RabbitMQ
      this.connection = await amqp.connect(
        process.env.RABBITMQ_URL || 'amqp://localhost:5672'
      );
      this.channel = await this.connection.createChannel();

      // Carregar os schemas protobuf
      this.proto = await protobuf.load(
        'src/presentation/grpc/proto/customers.proto'
      );

      this.logger.log('✅ RabbitMQ conectado e Protobuf carregado');
    } catch (error) {
      this.logger.error('❌ Erro ao conectar RabbitMQ:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    this.logger.log('🔌 RabbitMQ desconectado');
  }

  /**
   * Publica mensagem na fila usando Protobuf para serialização
   */
  async publish(queue: string, messageType: string, data: any): Promise<void> {
    try {
      if (!this.channel || !this.proto) {
        throw new Error('RabbitMQ não está conectado');
      }

      // Garantir que a fila existe
      await this.channel.assertQueue(queue, { durable: true });

      // Obter o tipo de mensagem do Protobuf
      const MessageType = this.proto.lookupType(`customers.${messageType}`);

      // Validar e serializar usando Protobuf
      const errMsg = MessageType.verify(data);
      if (errMsg) {
        throw new Error(`Erro de validação Protobuf: ${errMsg}`);
      }

      const message = MessageType.create(data);
      const buffer = Buffer.from(MessageType.encode(message).finish());

      // Publicar na fila
      this.channel!.sendToQueue(queue, buffer, {
        persistent: true,
        contentType: 'application/x-protobuf',
        type: messageType,
      });

      this.logger.log(
        `📤 Mensagem publicada na fila '${queue}' (${buffer.length} bytes)`
      );
    } catch (error) {
      this.logger.error(`❌ Erro ao publicar mensagem:`, error);
      throw error;
    }
  }

  /**
   * Consome mensagens da fila e desserializa usando Protobuf
   */
  async consume(
    queue: string,
    messageType: string,
    callback: (data: any) => Promise<void>,
  ): Promise<void> {
    try {
      if (!this.channel || !this.proto) {
        throw new Error('RabbitMQ não está conectado');
      }

      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.prefetch(1); // Processa uma mensagem por vez

      const MessageType = this.proto.lookupType(`customers.${messageType}`);

      this.logger.log(`👂 Aguardando mensagens na fila '${queue}'...`);

      this.channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            // Desserializar Protobuf
            const decoded = MessageType.decode(msg.content);
            const data = MessageType.toObject(decoded);

            this.logger.log(`📥 Mensagem recebida da fila '${queue}'`);

            // Processar mensagem
            await callback(data);

            // Confirmar processamento
            this.channel!.ack(msg);
          } catch (error) {
            this.logger.error('❌ Erro ao processar mensagem:', error);
            // Rejeitar e reenviar para fila (ou dead letter)
            this.channel!.nack(msg, false, false);
          }
        }
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao consumir da fila '${queue}':`, error);
      throw error;
    }
  }
}
