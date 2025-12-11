import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import * as protobuf from 'protobufjs';
import { join } from 'path';
import type { NotificationEntity } from '../domain/notification.entity';
import type { MessagingPort } from '../domain/ports/messaging.port';

export interface RabbitMQMessage {
    id: string;
    userId: string;
    orderId: string;
    status: string;
    message: string;
    serviceOrigin: string;
    timestamp: Date;
}

@Injectable()
export class RabbitMQService implements MessagingPort, OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RabbitMQService.name);
    private connection: amqp.Connection | null = null;
    private channel: amqp.Channel | null = null;
    private readonly exchangeName = 'delivery.notifications';
    private readonly queueName = 'notifications.service';
    private NotificationRequestType: protobuf.Type | null = null;
    private NotificationResponseType: protobuf.Type | null = null;

    async onModuleInit() {
        try {
            await this.loadProtoDefinitions();
            await this.connect();
            await this.setupExchangeAndQueue();
            this.logger.log('RabbitMQ connected and configured with Protobuf serialization');
        } catch (error) {
            this.logger.error('Failed to initialize RabbitMQ', error);
        }
    }

    private async loadProtoDefinitions(): Promise<void> {
        const PROTO_PATH = join(__dirname, '../presentation/grpc/notifications.proto');
        
        try {
            const root = await protobuf.load(PROTO_PATH);
            
            this.NotificationRequestType = root.lookupType('notifications.NotificationRequest');
            this.NotificationResponseType = root.lookupType('notifications.NotificationResponse');
            
            this.logger.log('Protobuf definitions loaded successfully for high-speed serialization');
        } catch (error) {
            this.logger.error('Failed to load Protobuf definitions', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.disconnect();
    }

    private async connect(): Promise<void> {
        const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
        this.connection = await amqp.connect(rabbitUrl) as any;
        this.channel = await (this.connection as any).createChannel();
    }

    private async setupExchangeAndQueue(): Promise<void> {
        if (!this.channel) throw new Error('Channel not initialized');

        await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
        await this.channel.assertQueue(this.queueName, { durable: true });
        await this.channel.bindQueue(this.queueName, this.exchangeName, 'notification.*');
    }

    async publishNotification(notification: NotificationEntity): Promise<void> {
        if (!this.channel || !this.NotificationRequestType) {
            this.logger.warn('Channel or Protobuf type not available, skipping message publish');
            return;
        }

        try {
            const protoMessage = {
                userId: notification.userId,
                orderId: notification.orderId,
                status: notification.status,
                serviceOrigin: notification.serviceOrigin,
                message: notification.message,
                additionalInfo: JSON.stringify({
                    id: notification.id,
                    timestamp: new Date().toISOString(),
                }),
            };

            const messageBuffer = this.serializeProtobuf(protoMessage);

            const routingKey = `notification.${notification.status.toLowerCase()}`;

            await this.channel.publish(
                this.exchangeName,
                routingKey,
                messageBuffer,
                { 
                    persistent: true, 
                    timestamp: Date.now(),
                    contentType: 'application/x-protobuf',
                }
            );

            this.logger.log(
                `Published notification (Protobuf - ${messageBuffer.length} bytes): ${notification.id} ` +
                `with routing key: ${routingKey}`
            );
        } catch (error) {
            this.logger.error('Failed to publish notification', error);
            throw error;
        }
    }

    private serializeProtobuf(message: any): Buffer {
        if (!this.NotificationRequestType) {
            throw new Error('NotificationRequest type not loaded');
        }

        const errMsg = this.NotificationRequestType.verify(message);
        if (errMsg) {
            throw new Error(`Protobuf validation failed: ${errMsg}`);
        }

        const protoMessage = this.NotificationRequestType.create(message);
        const buffer = this.NotificationRequestType.encode(protoMessage).finish();
        
        return Buffer.from(buffer);
    }

    private deserializeProtobuf(buffer: Buffer): any {
        if (!this.NotificationRequestType) {
            throw new Error('NotificationRequest type not loaded');
        }

        const decoded = this.NotificationRequestType.decode(buffer);

        return this.NotificationRequestType.toObject(decoded, {
            longs: String,
            enums: String,
            bytes: String,
            defaults: true,
            arrays: true,
            objects: true,
            oneofs: true,
        });
    }

    async consumeNotifications(callback: (message: RabbitMQMessage) => Promise<void>): Promise<void> {
        if (!this.channel) throw new Error('Channel not initialized');

        await this.channel.consume(this.queueName, async (msg: amqp.ConsumeMessage | null) => {
            if (msg) {
                try {
                    const decodedMessage = this.deserializeProtobuf(msg.content);

                    const additionalInfo = JSON.parse(decodedMessage.additionalInfo || '{}');
                    
                    const message: RabbitMQMessage = {
                        id: additionalInfo.id,
                        userId: decodedMessage.userId,
                        orderId: decodedMessage.orderId,
                        status: decodedMessage.status,
                        message: decodedMessage.message,
                        serviceOrigin: decodedMessage.serviceOrigin,
                        timestamp: new Date(additionalInfo.timestamp),
                    };

                    await callback(message);
                    this.channel!.ack(msg);
                    this.logger.log(`Processed notification (Protobuf): ${message.id}`);
                } catch (error) {
                    this.logger.error('Failed to process message', error);
                    this.channel!.nack(msg, false, false);
                }
            }
        });
    }

    private async disconnect(): Promise<void> {
        try {
            if (this.channel) await this.channel.close();
            if (this.connection) await (this.connection as any).close();
            this.logger.log('RabbitMQ disconnected');
        } catch (error) {
            this.logger.error('Error disconnecting RabbitMQ', error);
        }
    }
}