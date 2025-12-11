import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import * as protobuf from 'protobufjs';
import { join } from 'path';
import { MessagingPort } from '../domain/ports/messaging.port';

@Injectable()
export class RabbitMQService implements MessagingPort, OnModuleInit, OnModuleDestroy {
    private connection: amqp.Connection | null = null;
    private channel: amqp.Channel | null = null;
    private root: protobuf.Root;
    private PositionUpdateType: protobuf.Type;
    private TrackingStartedType: protobuf.Type;
    private DeliveryCompletedType: protobuf.Type;

    async onModuleInit() {
        await this.connect();
        await this.loadProtoDefinitions();
    }

    async onModuleDestroy() {
        await this.disconnect();
    }

    private async connect(): Promise<void> {
        try {
            const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
            this.connection = await amqp.connect(rabbitMQUrl) as any;
            this.channel = await (this.connection as any).createChannel();

            await this.channel!.assertExchange('delivery.tracking', 'topic', { durable: true });
            
            console.log('RabbitMQ connected and configured with Protobuf serialization');
        } catch (error) {
            console.error('Failed to connect to RabbitMQ:', error);
            throw error;
        }
    }

    private async disconnect(): Promise<void> {
        try {
            if (this.channel) await this.channel.close();
            if (this.connection) await (this.connection as any).close();
            console.log('RabbitMQ connection closed');
        } catch (error) {
            console.error('Error closing RabbitMQ connection:', error);
        }
    }

    private async loadProtoDefinitions(): Promise<void> {
        try {
            const protoPath = join(__dirname, './messaging/tracking-events.proto');
            this.root = await protobuf.load(protoPath);
            
            this.PositionUpdateType = this.root.lookupType('tracking.PositionUpdate');
            this.TrackingStartedType = this.root.lookupType('tracking.TrackingStarted');
            this.DeliveryCompletedType = this.root.lookupType('tracking.DeliveryCompleted');
            
            console.log('Protobuf definitions loaded successfully for high-speed serialization');
        } catch (error) {
            console.error('Failed to load Protobuf definitions:', error);
            throw error;
        }
    }

    private serializeProtobuf(messageType: protobuf.Type, data: any): Buffer {
        const errMsg = messageType.verify(data);
        if (errMsg) {
            throw new Error(`Protobuf validation error: ${errMsg}`);
        }

        const message = messageType.create(data);
        const buffer = messageType.encode(message).finish();
        
        return Buffer.from(buffer);
    }

    async publishPositionUpdate(data: {
        deliveryId: string;
        orderId: string;
        latitude: number;
        longitude: number;
        deliveryPersonId: string;
        timestamp: Date;
    }): Promise<void> {
        const payload = {
            delivery_id: data.deliveryId,
            order_id: data.orderId,
            latitude: data.latitude,
            longitude: data.longitude,
            delivery_person_id: data.deliveryPersonId,
            timestamp: data.timestamp.getTime(),
        };

        const buffer = this.serializeProtobuf(this.PositionUpdateType, payload);

        this.channel!.publish(
            'delivery.tracking',
            'tracking.position.updated',
            buffer,
            {
                contentType: 'application/x-protobuf',
                persistent: true,
            }
        );

        console.log(`Published position update (Protobuf - ${buffer.length} bytes) for delivery ${data.deliveryId}`);
    }

    async publishTrackingStarted(data: {
        deliveryId: string;
        orderId: string;
        destinationLat: number;
        destinationLng: number;
    }): Promise<void> {
        const payload = {
            delivery_id: data.deliveryId,
            order_id: data.orderId,
            destination_lat: data.destinationLat,
            destination_lng: data.destinationLng,
            started_at: Date.now(),
        };

        const buffer = this.serializeProtobuf(this.TrackingStartedType, payload);

        this.channel!.publish(
            'delivery.tracking',
            'tracking.started',
            buffer,
            {
                contentType: 'application/x-protobuf',
                persistent: true,
            }
        );

        console.log(`Published tracking started (Protobuf - ${buffer.length} bytes) for delivery ${data.deliveryId}`);
    }

    async publishDeliveryCompleted(data: {
        deliveryId: string;
        orderId: string;
        completedAt: Date;
    }): Promise<void> {
        const payload = {
            delivery_id: data.deliveryId,
            order_id: data.orderId,
            completed_at: data.completedAt.getTime(),
        };

        const buffer = this.serializeProtobuf(this.DeliveryCompletedType, payload);

        this.channel!.publish(
            'delivery.tracking',
            'tracking.completed',
            buffer,
            {
                contentType: 'application/x-protobuf',
                persistent: true,
            }
        );

        console.log(`Published delivery completed (Protobuf - ${buffer.length} bytes) for delivery ${data.deliveryId}`);
    }

    private deserializeProtobuf(messageType: protobuf.Type, buffer: Buffer): any {
        const decoded = messageType.decode(buffer);
        return messageType.toObject(decoded, {
            longs: String,
            enums: String,
            bytes: String,
            defaults: true,
            arrays: true,
            objects: true,
            oneofs: true,
        });
    }

    async consumeOrderEvents(callback: (message: any) => Promise<void>): Promise<void> {
        if (!this.channel) throw new Error('Channel not initialized');

        const queueName = 'tracking.orders.queue';
        
        await this.channel.assertQueue(queueName, { durable: true });
        await this.channel.bindQueue(queueName, 'delivery.orders', 'order.*');

        await this.channel.consume(queueName, async (msg) => {
            if (msg) {
                try {
                    const decoded = this.deserializeProtobuf(this.TrackingStartedType, msg.content);
                    await callback(decoded);
                    this.channel!.ack(msg);
                    console.log(`Consumed order event (Protobuf - ${msg.content.length} bytes)`);
                } catch (error) {
                    console.error('Failed to process order event:', error);
                    this.channel!.nack(msg, false, false);
                }
            }
        });
    }
}
