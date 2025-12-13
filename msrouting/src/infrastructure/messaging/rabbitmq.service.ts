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
      // Connect to RabbitMQ
      this.connection = await amqp.connect(
        process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      );
      this.channel = await this.connection.createChannel();

      // Load protobuf schemas
      this.proto = await protobuf.load(
        'src/presentation/grpc/routing.proto',
      );

      this.logger.log('RabbitMQ connected and Protobuf loaded');
    } catch (error) {
      this.logger.error('Error connecting to RabbitMQ:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    this.logger.log('RabbitMQ disconnected');
  }

  /**
   * Publishes message to queue using Protobuf for serialization
   */
  async publish(queue: string, messageType: string, data: any): Promise<void> {
    try {
      if (!this.channel || !this.proto) {
        throw new Error('RabbitMQ is not connected');
      }

      // Ensure queue exists
      await this.channel.assertQueue(queue, { durable: true });

      // Get Protobuf message type
      const MessageType = this.proto.lookupType(`routing.v1.${messageType}`);

      // Validate and serialize using Protobuf
      const errMsg = MessageType.verify(data);
      if (errMsg) {
        throw new Error(`Protobuf validation error: ${errMsg}`);
      }

      const message = MessageType.create(data);
      const buffer = Buffer.from(MessageType.encode(message).finish());

      // Publish to queue
      this.channel.sendToQueue(queue, buffer, {
        persistent: true,
        contentType: 'application/x-protobuf',
        type: messageType,
      });

      this.logger.debug(
        `Message published to queue '${queue}'`,
      );
    } catch (error) {
      this.logger.error(`Error publishing message:`, error);
      throw error;
    }
  }

  /**
   * Consumes messages from queue and deserializes using Protobuf
   */
  async consume(
    queue: string,
    messageType: string,
    callback: (data: any) => Promise<void>,
  ): Promise<void> {
    try {
      if (!this.channel || !this.proto) {
        throw new Error('RabbitMQ is not connected');
      }

      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.prefetch(1); // Process one message at a time

      const MessageType = this.proto.lookupType(`routing.v1.${messageType}`);

      this.logger.log(`Waiting for messages on queue '${queue}'...`);

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
