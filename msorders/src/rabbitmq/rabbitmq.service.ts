import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';

export interface RabbitMQConfig {
  url: string;
  exchanges?: Array<{
    name: string;
    type: string;
    options?: amqp.Options.AssertExchange;
  }>;
  queues?: Array<{
    name: string;
    exchange?: string;
    routingKey?: string;
    options?: amqp.Options.AssertQueue;
  }>;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;
  private readonly config: RabbitMQConfig;
  private consumers: Map<string, (msg: ConsumeMessage | null) => void> =
    new Map();

  constructor(config: RabbitMQConfig) {
    this.config = config;
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      this.logger.log(`Connecting to RabbitMQ: ${this.config.url}`);

      this.connection = amqp.connect([this.config.url], {
        heartbeatIntervalInSeconds: 30,
        reconnectTimeInSeconds: 2,
      });

      this.connection.on('connect', () => {
        this.logger.log('✅ Connected to RabbitMQ');
      });

      this.connection.on('disconnect', (err) => {
        this.logger.warn('Disconnected from RabbitMQ', (err as any)?.message);
      });

      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error', err);
      });

      this.channelWrapper = this.connection.createChannel({
        json: false, // Vamos usar Protobuf, não JSON
        setup: async (channel) => {
          // Setup exchanges
          if (this.config.exchanges) {
            for (const exchange of this.config.exchanges) {
              await channel.assertExchange(
                exchange.name,
                exchange.type,
                exchange.options || { durable: true },
              );
              this.logger.log(`Exchange "${exchange.name}" created/verified`);
            }
          }

          // Setup queues
          if (this.config.queues) {
            for (const queue of this.config.queues) {
              await channel.assertQueue(
                queue.name,
                queue.options || { durable: true },
              );
              this.logger.log(`Queue "${queue.name}" created/verified`);

              // Bind queue to exchange if specified
              if (queue.exchange && queue.routingKey) {
                await channel.bindQueue(
                  queue.name,
                  queue.exchange,
                  queue.routingKey,
                );
                this.logger.log(
                  `Queue "${queue.name}" bound to exchange "${queue.exchange}" with routing key "${queue.routingKey}"`,
                );
              }
            }
          }
        },
      });

      await this.channelWrapper.waitForConnect();
      this.logger.log('✅ RabbitMQ Channel ready');
    } catch (error) {
      this.logger.error('❌ Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  /**
   * Publica mensagem serializada com Protobuf
   * @param exchange Nome da exchange
   * @param routingKey Routing key
   * @param message Buffer do Protobuf (já serializado)
   * @param options Opções adicionais
   */
  async publishProtobuf(
    exchange: string,
    routingKey: string,
    message: Buffer,
    options?: amqp.Options.Publish,
  ): Promise<void> {
    try {
      await this.channelWrapper.publish(exchange, routingKey, message, {
        persistent: true,
        contentType: 'application/x-protobuf',
        ...options,
      });

      this.logger.debug(
        `📤 Published protobuf message to ${exchange}/${routingKey} (${message.length} bytes)`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to publish message to ${exchange}/${routingKey}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Publica mensagem diretamente para uma fila
   * @param queue Nome da fila
   * @param message Buffer do Protobuf
   * @param options Opções adicionais
   */
  async sendToQueue(
    queue: string,
    message: Buffer,
    options?: amqp.Options.Publish,
  ): Promise<void> {
    try {
      await this.channelWrapper.sendToQueue(queue, message, {
        persistent: true,
        contentType: 'application/x-protobuf',
        ...options,
      });

      this.logger.debug(
        `📤 Sent protobuf message to queue "${queue}" (${message.length} bytes)`,
      );
    } catch (error) {
      this.logger.error(`❌ Failed to send message to queue "${queue}"`, error);
      throw error;
    }
  }

  /**
   * Consome mensagens de uma fila
   * @param queue Nome da fila
   * @param onMessage Callback que recebe o ConsumeMessage
   */
  async consume(
    queue: string,
    onMessage: (msg: ConsumeMessage | null) => void,
  ): Promise<void> {
    try {
      await this.channelWrapper.addSetup(async (channel) => {
        await channel.consume(
          queue,
          (msg) => {
            if (msg) {
              try {
                onMessage(msg);
                channel.ack(msg);
              } catch (error) {
                this.logger.error(
                  `❌ Error processing message from queue "${queue}"`,
                  error,
                );
                channel.nack(msg, false, false); // Não requeue
              }
            }
          },
          { noAck: false },
        );
      });

      this.consumers.set(queue, onMessage);
      this.logger.log(`📥 Started consuming from queue "${queue}"`);
    } catch (error) {
      this.logger.error(`❌ Failed to consume from queue "${queue}"`, error);
      throw error;
    }
  }

  /**
   * Cria um RPC pattern: envia mensagem e aguarda resposta
   * @param queue Fila de destino
   * @param message Buffer do Protobuf
   * @param timeout Timeout em ms
   */
  async rpcCall(
    queue: string,
    message: Buffer,
    timeout: number = 5000,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const correlationId = this.generateId();
      const replyQueue = `amq.rabbitmq.reply-to`;

      let timeoutId: NodeJS.Timeout;

      const onMessage = (msg: ConsumeMessage | null) => {
        if (msg && msg.properties.correlationId === correlationId) {
          clearTimeout(timeoutId);
          resolve(msg.content);
        }
      };

      this.channelWrapper.addSetup(async (channel) => {
        await channel.consume(
          replyQueue,
          (msg) => {
            if (msg?.properties.correlationId === correlationId) {
              onMessage(msg);
              channel.ack(msg);
            }
          },
          { noAck: false },
        );

        await channel.sendToQueue(queue, message, {
          correlationId,
          replyTo: replyQueue,
          contentType: 'application/x-protobuf',
        });
      });

      timeoutId = setTimeout(() => {
        reject(new Error(`RPC timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channelWrapper) {
        await this.channelWrapper.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('👋 Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('❌ Error disconnecting from RabbitMQ', error);
    }
  }

  private generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  getConnection(): amqp.AmqpConnectionManager {
    return this.connection;
  }

  getChannel(): ChannelWrapper {
    return this.channelWrapper;
  }
}
