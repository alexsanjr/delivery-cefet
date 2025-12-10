import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqplib from 'amqplib';
import { ProtobufSerializerImpl } from '../serializers/protobuf.serializer';
import { EXCHANGE_NAMES, QUEUE_NAMES, ROUTING_KEYS } from '../constants/queue.constants';

export interface PublishOptions {
  routingKey?: string;
  correlationId?: string;
  messageId?: string;
  persistent?: boolean;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;
  private readonly serializer: ProtobufSerializerImpl;

  constructor() {
    this.serializer = new ProtobufSerializerImpl('proto/events.proto');
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
    await this.serializer.initialize();
    await this.setupExchangesAndQueues();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    
    try {
      this.connection = await amqplib.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      
      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed. Attempting to reconnect...');
        setTimeout(() => this.connect(), 5000);
      });

      this.logger.log('Connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  private async setupExchangesAndQueues(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    // Setup exchanges
    await this.channel.assertExchange(EXCHANGE_NAMES.DELIVERY_EVENTS, 'topic', {
      durable: true,
    });
    
    await this.channel.assertExchange(EXCHANGE_NAMES.DELIVERY_COMMANDS, 'direct', {
      durable: true,
    });

    // Setup event queues and bindings
    const eventQueues = [
      { queue: QUEUE_NAMES.DELIVERY_CREATED, routingKey: ROUTING_KEYS.DELIVERY_CREATED },
      { queue: QUEUE_NAMES.DELIVERY_ASSIGNED, routingKey: ROUTING_KEYS.DELIVERY_ASSIGNED },
      { queue: QUEUE_NAMES.DELIVERY_STATUS_UPDATED, routingKey: ROUTING_KEYS.DELIVERY_STATUS_UPDATED },
      { queue: QUEUE_NAMES.DELIVERY_COMPLETED, routingKey: ROUTING_KEYS.DELIVERY_COMPLETED },
      { queue: QUEUE_NAMES.DELIVERY_PERSON_CREATED, routingKey: ROUTING_KEYS.DELIVERY_PERSON_CREATED },
      { queue: QUEUE_NAMES.DELIVERY_PERSON_STATUS_UPDATED, routingKey: ROUTING_KEYS.DELIVERY_PERSON_STATUS_UPDATED },
      { queue: QUEUE_NAMES.DELIVERY_PERSON_LOCATION_UPDATED, routingKey: ROUTING_KEYS.DELIVERY_PERSON_LOCATION_UPDATED },
    ];

    for (const { queue, routingKey } of eventQueues) {
      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.bindQueue(queue, EXCHANGE_NAMES.DELIVERY_EVENTS, routingKey);
    }

    // Setup command queues
    const commandQueues = [
      QUEUE_NAMES.ASSIGN_DELIVERY_COMMAND,
      QUEUE_NAMES.CREATE_DELIVERY_COMMAND,
      QUEUE_NAMES.UPDATE_DELIVERY_STATUS_COMMAND,
    ];

    for (const queue of commandQueues) {
      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.bindQueue(queue, EXCHANGE_NAMES.DELIVERY_COMMANDS, queue);
    }

    this.logger.log('RabbitMQ exchanges and queues setup completed');
  }

  async publish<T extends object>(
    exchange: string,
    routingKey: string,
    messageName: string,
    data: T,
    options: PublishOptions = {},
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    try {
      const buffer = this.serializer.serializeSync(messageName, data);
      
      this.channel.publish(exchange, routingKey, buffer, {
        persistent: options.persistent ?? true,
        correlationId: options.correlationId,
        messageId: options.messageId || this.generateMessageId(),
        contentType: 'application/x-protobuf',
        timestamp: Date.now(),
      });

      this.logger.debug(`Published message to ${exchange}/${routingKey}: ${messageName}`);
    } catch (error) {
      this.logger.error(`Failed to publish message: ${error}`);
      throw error;
    }
  }

  async publishEvent<T extends object>(
    routingKey: string,
    messageName: string,
    data: T,
  ): Promise<void> {
    await this.publish(EXCHANGE_NAMES.DELIVERY_EVENTS, routingKey, messageName, data);
  }

  async publishCommand<T extends object>(
    queue: string,
    messageName: string,
    data: T,
    correlationId?: string,
  ): Promise<void> {
    await this.publish(EXCHANGE_NAMES.DELIVERY_COMMANDS, queue, messageName, data, {
      correlationId,
    });
  }

  async consume<T extends object>(
    queue: string,
    messageName: string,
    handler: (message: T, msg: amqplib.ConsumeMessage) => Promise<void>,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    await this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const data = this.serializer.deserializeSync<T>(messageName, msg.content);
        await handler(data, msg);
        this.channel?.ack(msg);
      } catch (error) {
        this.logger.error(`Error processing message from ${queue}:`, error);
        // Requeue on failure with delay
        this.channel?.nack(msg, false, true);
      }
    });

    this.logger.log(`Started consuming from queue: ${queue}`);
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getChannel(): amqplib.Channel | null {
    return this.channel;
  }
}
