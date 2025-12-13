import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
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
      this.connection = await amqp.connect(
        process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      );
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange('customer.events', 'topic', {
        durable: true,
      });

      this.proto = await protobuf.load(
        'src/presentation/grpc/proto/customers.proto',
      );

      this.logger.log('RabbitMQ connected and Protobuf loaded');
    } catch (error) {
      this.logger.error('Failed to connect RabbitMQ:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    this.logger.log('RabbitMQ disconnected');
  }

  async publish(
    routingKey: string,
    messageType: string,
    data: any,
  ): Promise<void> {
    try {
      if (!this.channel || !this.proto) {
        throw new Error('RabbitMQ not connected');
      }

      const MessageType = this.proto.lookupType(`customers.${messageType}`);

      const errMsg = MessageType.verify(data);
      if (errMsg) {
        throw new Error(`Protobuf validation error: ${errMsg}`);
      }

      const message = MessageType.create(data);
      const buffer = Buffer.from(MessageType.encode(message).finish());

      this.channel.publish('customer.events', routingKey, buffer, {
        persistent: true,
        contentType: 'application/x-protobuf',
        type: messageType,
      });

      this.logger.debug(
        `Event published: customer.events/${routingKey} (${buffer.length} bytes)`,
      );
    } catch (error) {
      this.logger.error(`Error publishing message:`, error);
      throw error;
    }
  }

  async consume(
    queue: string,
    messageType: string,
    callback: (data: any) => Promise<any>,
  ): Promise<void> {
    try {
      if (!this.channel || !this.proto) {
        throw new Error('RabbitMQ not connected');
      }

      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.prefetch(1);

      const RequestType = this.proto.lookupType(`customers.${messageType}`);
      
      let ResponseType;
      if (messageType === 'ValidateCustomerRequest') {
        ResponseType = this.proto.lookupType('customers.ValidateCustomerResponse');
      } else if (messageType === 'GetCustomerRequest') {
        ResponseType = this.proto.lookupType('customers.CustomerResponse');
      }

      this.logger.log(`Waiting for messages on '${queue}'...`);

      this.channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            const decoded = RequestType.decode(msg.content);
            const data = RequestType.toObject(decoded);

            this.logger.debug(`Message received from '${queue}'`);

            const responseData = await callback(data);

            if (msg.properties.replyTo && ResponseType) {
              const responseMessage = ResponseType.create(responseData);
              const responseBuffer = Buffer.from(
                ResponseType.encode(responseMessage).finish(),
              );

              this.channel!.sendToQueue(msg.properties.replyTo, responseBuffer, {
                correlationId: msg.properties.correlationId,
                contentType: 'application/x-protobuf',
              });
            }

            this.channel!.ack(msg);
          } catch (error) {
            this.logger.error('Error processing message:', error);
            this.channel!.nack(msg, false, false);
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error consuming from '${queue}':`, error);
      throw error;
    }
  }
}
