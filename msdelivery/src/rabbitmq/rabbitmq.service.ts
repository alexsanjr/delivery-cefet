import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;
  private replyConsumerSetup = false;
  private pendingReplies: Map<string, { resolve: (value: Buffer) => void; reject: (error: Error) => void }> = new Map();

  async onModuleInit() {
    const url = process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672';
    
    this.logger.log(`Connecting to RabbitMQ: ${url}`);

    this.connection = amqp.connect([url], {
      heartbeatIntervalInSeconds: 30,
      reconnectTimeInSeconds: 5,
    });

    this.connection.on('connect', () => {
      this.logger.log('Connected to RabbitMQ');
    });

    this.connection.on('disconnect', (params: any) => {
      this.logger.warn('Disconnected from RabbitMQ', params?.err?.message || 'Unknown');
    });

    this.connection.on('connectFailed', (params: any) => {
      this.logger.error('Failed to connect to RabbitMQ:', params?.err?.message || 'Unknown error');
    });

    this.channelWrapper = this.connection.createChannel({
      json: false,
      setup: async (channel: ConfirmChannel) => {
        await channel.assertQueue('orders.get.queue', { durable: true });
        await channel.assertQueue('orders.by-status.queue', { durable: true });
        await channel.assertQueue('orders.update-status.queue', { durable: true });

        this.logger.log('RabbitMQ queues configured');
      },
    });

    await this.channelWrapper.waitForConnect();
    this.logger.log('RabbitMQ Channel ready');
  }

  async onModuleDestroy() {
    this.logger.log('Closing RabbitMQ connection...');
    await this.channelWrapper.close();
    await this.connection.close();
  }

  async rpcCall(
    queue: string,
    message: Buffer,
    timeout: number = 5000,
  ): Promise<Buffer> {
    this.logger.debug(`Starting RPC call to queue "${queue}" (timeout: ${timeout}ms)`);
    
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
        this.logger.error(`Error sending RPC message: ${error.message}`);
        reject(error);
      }
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
