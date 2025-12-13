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
  private replyConsumerSetup = false;
  private pendingReplies: Map<
    string,
    { resolve: (value: Buffer) => void; reject: (error: Error) => void }
  > = new Map();

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
        this.logger.log('Connected to RabbitMQ');
      });

      this.connection.on('disconnect', (err) => {
        this.logger.warn('Disconnected from RabbitMQ', (err as any)?.message);
      });

      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error', err);
      });

      this.channelWrapper = this.connection.createChannel({
        json: false,
        setup: async (channel) => {
          if (this.config.exchanges) {
            for (const exchange of this.config.exchanges) {
              await channel.assertExchange(
                exchange.name,
                exchange.type,
                exchange.options || { durable: true },
              );
            }
          }

          if (this.config.queues) {
            for (const queue of this.config.queues) {
              await channel.assertQueue(
                queue.name,
                queue.options || { durable: true },
              );

              if (queue.exchange && queue.routingKey) {
                await channel.bindQueue(
                  queue.name,
                  queue.exchange,
                  queue.routingKey,
                );
              }
            }
          }
        },
      });

      await this.channelWrapper.waitForConnect();
      this.logger.log('RabbitMQ Channel ready');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

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
        `Published protobuf message to ${exchange}/${routingKey} (${message.length} bytes)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish message to ${exchange}/${routingKey}`,
        error,
      );
      throw error;
    }
  }

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
        `Sent protobuf message to queue "${queue}" (${message.length} bytes)`,
      );
    } catch (error) {
      this.logger.error(`Failed to send message to queue "${queue}"`, error);
      throw error;
    }
  }

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
                  `Error processing message from queue "${queue}"`,
                  error,
                );
                channel.nack(msg, false, false);
              }
            }
          },
          { noAck: false },
        );
      });

      this.consumers.set(queue, onMessage);
      this.logger.log(`Started consuming from queue "${queue}"`);
    } catch (error) {
      this.logger.error(`Failed to consume from queue "${queue}"`, error);
      throw error;
    }
  }

  async consumeRpc(
    queue: string,
    requestProto: any,
    handler: (request: any) => Promise<any>,
  ): Promise<void> {
    try {
      await this.channelWrapper.addSetup(async (channel) => {
        await channel.assertQueue(queue, { durable: true });

        await channel.consume(
          queue,
          async (msg) => {
            if (!msg) return;

            try {
              const request = requestProto.decode(msg.content);
              const requestObj = requestProto.toObject(request, {
                longs: Number,
                enums: String,
                bytes: String,
              });

              this.logger.debug(`RPC request received on queue "${queue}"`);

              const response = await handler(requestObj);
              const responseBuffer = response.constructor.encode(response).finish();

              if (msg.properties.replyTo) {
                channel.sendToQueue(
                  msg.properties.replyTo,
                  Buffer.from(responseBuffer),
                  {
                    correlationId: msg.properties.correlationId,
                  },
                );
              }

              channel.ack(msg);
            } catch (error) {
              this.logger.error(
                `Error processing RPC message from queue "${queue}": ${error.message}`,
                error.stack,
              );
              channel.nack(msg, false, false);
            }
          },
          { noAck: false },
        );
      });

      this.logger.log(`Started RPC consumer on queue "${queue}"`);
    } catch (error) {
      this.logger.error(`Failed to setup RPC consumer on queue "${queue}"`, error);
      throw error;
    }
  }

  async rpcCall(
    queue: string,
    message: Buffer,
    timeout: number = 5000,
  ): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      const correlationId = this.generateId();
      const replyQueue = `amq.rabbitmq.reply-to`;

      if (!this.replyConsumerSetup) {
        await this.channelWrapper.addSetup(async (channel) => {
          await channel.consume(
            replyQueue,
            (msg) => {
              if (msg) {
                const pending = this.pendingReplies.get(
                  msg.properties.correlationId,
                );
                if (pending) {
                  pending.resolve(msg.content);
                  this.pendingReplies.delete(msg.properties.correlationId);
                }
              }
            },
            { noAck: true },
          );
        });
        this.replyConsumerSetup = true;
        await this.channelWrapper.waitForConnect();
      }

      const timeoutId = setTimeout(() => {
        this.pendingReplies.delete(correlationId);
        reject(new Error(`RPC timeout after ${timeout}ms`));
      }, timeout);

      this.pendingReplies.set(correlationId, {
        resolve: (content: Buffer) => {
          clearTimeout(timeoutId);
          resolve(content);
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
      });

      try {
        await this.channelWrapper.sendToQueue(queue, message, {
          correlationId,
          replyTo: replyQueue,
          contentType: 'application/x-protobuf',
        });
      } catch (error) {
        this.pendingReplies.delete(correlationId);
        clearTimeout(timeoutId);
        reject(error);
      }
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
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
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
