import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import * as protobuf from 'protobufjs';
import { join } from 'path';
import type { NotificationEntity } from '../../domain/notification.entity';
import type { MessagingPort } from '../../domain/ports/messaging.port';

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
    private readonly exchangeName = 'orders.events';
    private readonly queueName = 'notifications.service';
    private NotificationRequestType: protobuf.Type | null = null;
    private NotificationResponseType: protobuf.Type | null = null;
    private OrderStatusChangedEventType: protobuf.Type | null = null;
    private OrderCreatedEventType: protobuf.Type | null = null;
    private OrderCancelledEventType: protobuf.Type | null = null;
    private TrackingNotificationEventType: protobuf.Type | null = null;

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
        const NOTIFICATIONS_PROTO_PATH = join(__dirname, '../../presentation/grpc/notifications.proto');
        const ORDER_EVENTS_PROTO_PATH = join(__dirname, '../../../proto/order-events.proto');
        
        try {
            const notificationsRoot = await protobuf.load(NOTIFICATIONS_PROTO_PATH);
            this.NotificationRequestType = notificationsRoot.lookupType('notifications.NotificationRequest');
            this.NotificationResponseType = notificationsRoot.lookupType('notifications.NotificationResponse');

            const orderEventsRoot = await protobuf.load(ORDER_EVENTS_PROTO_PATH);
            this.OrderStatusChangedEventType = orderEventsRoot.lookupType('orders.events.OrderStatusChangedEvent');
            this.OrderCreatedEventType = orderEventsRoot.lookupType('orders.events.OrderCreatedEvent');
            this.OrderCancelledEventType = orderEventsRoot.lookupType('orders.events.OrderCancelledEvent');
            this.TrackingNotificationEventType = orderEventsRoot.lookupType('orders.events.TrackingNotificationEvent');
            
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
        this.logger.log(`Exchange asserted: ${this.exchangeName}`);
        
        const queueResult = await this.channel.assertQueue(this.queueName, { durable: true });
        this.logger.log(`Queue asserted: ${this.queueName} (${queueResult.messageCount} messages, ${queueResult.consumerCount} consumers)`);
        
        await this.channel.bindQueue(this.queueName, this.exchangeName, 'order.created');
        this.logger.log(`Binding created: ${this.queueName} <- ${this.exchangeName} [order.created]`);
        
        await this.channel.bindQueue(this.queueName, this.exchangeName, 'order.status.changed');
        this.logger.log(`Binding created: ${this.queueName} <- ${this.exchangeName} [order.status.changed]`);
        
        await this.channel.bindQueue(this.queueName, this.exchangeName, 'order.cancelled');
        this.logger.log(`Binding created: ${this.queueName} <- ${this.exchangeName} [order.cancelled]`);
        
        await this.channel.bindQueue(this.queueName, this.exchangeName, 'order.notification');
        this.logger.log(`Binding created: ${this.queueName} <- ${this.exchangeName} [order.notification]`);
    }

    private async waitForChannel(maxRetries = 30, delayMs = 1000): Promise<void> {
        for (let i = 0; i < maxRetries; i++) {
            if (this.channel) {
                this.logger.log('Channel is ready');
                return;
            }
            this.logger.log(`Waiting for channel to be ready (${i + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        throw new Error('Channel initialization timeout');
    }

    async publishNotification(notification: NotificationEntity): Promise<void> {
        if (!this.channel || !this.NotificationRequestType) {
            this.logger.warn('Channel or Protobuf type not available, skipping message publish');
            return;
        }

        try {
            const primitives = notification.toPrimitives();
            const protoMessage = {
                userId: primitives.userId,
                orderId: primitives.orderId,
                status: primitives.status,
                serviceOrigin: primitives.serviceOrigin,
                message: primitives.message,
                additionalInfo: JSON.stringify({
                    id: primitives.id,
                    timestamp: new Date().toISOString(),
                }),
            };

            const messageBuffer = this.serializeProtobuf(protoMessage);

            const routingKey = `notification.${primitives.status.toLowerCase()}`;

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
                `Published notification (Protobuf - ${messageBuffer.length} bytes): ${primitives.id} ` +
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

    private deserializeOrderEvent(buffer: Buffer, routingKey: string): any {
        this.logger.debug(`Deserializing event with routing key: ${routingKey}, buffer size: ${buffer.length} bytes`);

        let eventType: protobuf.Type | null = null;

        if (routingKey === 'order.created') {
            eventType = this.OrderCreatedEventType;
        } else if (routingKey === 'order.status.changed') {
            eventType = this.OrderStatusChangedEventType;
        } else if (routingKey === 'order.cancelled') {
            eventType = this.OrderCancelledEventType;
        } else if (routingKey === 'order.notification') {
            eventType = this.TrackingNotificationEventType;
        }

        if (!eventType) {
            throw new Error(`Unknown order event type for routing key: ${routingKey}`);
        }

        const decoded = eventType.decode(buffer);
        const result = eventType.toObject(decoded, {
            longs: String,
            enums: String,
            bytes: String,
            defaults: true,
            arrays: true,
            objects: true,
            oneofs: true,
        });
        
        this.logger.debug(`Deserialized event: ${JSON.stringify(result)}`);
        return result;
    }

    async consumeOrderEvents(callback: (event: any, routingKey: string) => Promise<void>): Promise<void> {
        await this.waitForChannel();
        
        if (!this.channel) throw new Error('Channel not initialized');

        this.logger.log(`Starting to consume from queue: ${this.queueName}`);

        await this.channel.consume(this.queueName, async (msg: amqp.ConsumeMessage | null) => {
            if (msg) {
                try {
                    const routingKey = msg.fields.routingKey;
                    this.logger.log(`Received message with routing key: ${routingKey}`);

                    const decodedEvent = this.deserializeOrderEvent(msg.content, routingKey);
                    
                    await callback(decodedEvent, routingKey);
                    this.channel!.ack(msg);
                    this.logger.log(`Processed order event (Protobuf): ${routingKey}`);
                } catch (error) {
                    this.logger.error(`Failed to process order event: ${error.message}`, error);
                    this.channel!.nack(msg, false, false);
                }
            }
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
