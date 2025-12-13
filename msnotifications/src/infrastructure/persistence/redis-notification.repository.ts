import Redis from 'ioredis';
import { Injectable } from "@nestjs/common";
import { InjectRedis } from "@nestjs-modules/ioredis";
import { NotificationEntity } from "../../domain/notification.entity";
import { NotificationId } from "../../domain/value-objects/notification-id.vo";
import { UserId } from "../../domain/value-objects/user-id.vo";
import { OrderId } from "../../domain/value-objects/order-id.vo";
import { NotificationStatus } from "../../domain/value-objects/notification-status.vo";
import { ServiceOrigin } from "../../domain/value-objects/service-origin.vo";
import type { NotificationRepositoryPort } from "../../domain/ports/notification-repository.port";

@Injectable()
export class RedisNotificationRepository implements NotificationRepositoryPort {
    constructor(
        @InjectRedis() private readonly redis: Redis,
    ) {}

    async save(notification: NotificationEntity): Promise<void> {
        const primitives = notification.toPrimitives();
        await this.redis.set(`notification:${primitives.id}`, JSON.stringify(primitives));
        await this.redis.sadd(`user:${primitives.userId}:notifications`, primitives.id);
        await this.redis.sadd(`order:${primitives.orderId}:notifications`, primitives.id);
    }

    async findById(id: NotificationId): Promise<NotificationEntity | null> {
        const data = await this.redis.get(`notification:${id.getValue()}`);
        if (!data) {
            return null;
        }
        return this.hydrateNotification(JSON.parse(data));
    }

    async findByUserId(userId: UserId): Promise<NotificationEntity[]> {
        const notificationIds = await this.redis.smembers(`user:${userId.getValue()}:notifications`);
        const notifications: NotificationEntity[] = [];
        
        for (const id of notificationIds) {
            const data = await this.redis.get(`notification:${id}`);
            if (data) {
                const notification = this.hydrateNotification(JSON.parse(data));
                notifications.push(notification);
            }
        }
        
        return notifications.sort((a, b) => 
            b.getCreatedAt().getTime() - a.getCreatedAt().getTime()
        );
    }

    async findByOrderId(orderId: OrderId): Promise<NotificationEntity[]> {
        const notificationIds = await this.redis.smembers(`order:${orderId.getValue()}:notifications`);
        const notifications: NotificationEntity[] = [];
        
        for (const id of notificationIds) {
            const data = await this.redis.get(`notification:${id}`);
            if (data) {
                const notification = this.hydrateNotification(JSON.parse(data));
                notifications.push(notification);
            }
        }
        
        return notifications.sort((a, b) => 
            b.getCreatedAt().getTime() - a.getCreatedAt().getTime()
        );
    }

    async update(notification: NotificationEntity): Promise<void> {
        const primitives = notification.toPrimitives();
        await this.redis.set(`notification:${primitives.id}`, JSON.stringify(primitives));
    }

    private hydrateNotification(data: any): NotificationEntity {
        return NotificationEntity.reconstitute(
            NotificationId.from(data.id),
            UserId.create(data.userId),
            OrderId.create(data.orderId),
            NotificationStatus.create(data.status),
            data.message,
            ServiceOrigin.create(data.serviceOrigin),
            data.isRead,
            new Date(data.createdAt),
            new Date(data.updatedAt),
        );
    }
}
