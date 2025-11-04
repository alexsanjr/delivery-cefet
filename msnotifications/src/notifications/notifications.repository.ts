import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { Injectable } from "@nestjs/common";
import { InjectRedis } from "@nestjs-modules/ioredis";
import { NotificationEntity } from "../database/entities/notifications.entity";
import { CreateNotificationDto } from "./dto/notifications-create.dto";

@Injectable()
export class NotificationsRepository {
    constructor(
        @InjectRedis() private readonly redis: Redis,
    ) {}

    async create(createNotificationDto: CreateNotificationDto & { message: string }): Promise<NotificationEntity> {
        const id = uuidv4();
        const notification: NotificationEntity = {
            id,
            ...createNotificationDto,
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await this.redis.set(`notification:${notification.id}`, JSON.stringify(notification));
        await this.redis.sadd(`user:${notification.userId}:notifications`, notification.id);
        await this.redis.sadd(`order:${notification.orderId}:notifications`, notification.id);
        return notification;
    }

    async findByUserId(userId: string): Promise<NotificationEntity[]> {
        const notificationIds = await this.redis.smembers(`user:${userId}:notifications`);
        const notifications: NotificationEntity[] = [];
        for (const id of notificationIds) {
            const data = await this.redis.get(`notification:${id}`);
            if (data) {
                notifications.push(JSON.parse(data));
            }
        }
        return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async findByOrderId(orderId: string): Promise<NotificationEntity[]> {
        const notificationIds = await this.redis.smembers(`order:${orderId}:notifications`);
        const notifications: NotificationEntity[] = [];
        for (const id of notificationIds) {
            const data = await this.redis.get(`notification:${id}`);
            if (data) {
                notifications.push(JSON.parse(data));
            }
        }
        return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async markAsRead(notificationId: string): Promise<void> {
        const data = await this.redis.get(`notification:${notificationId}`);
        if (data) {
            const notification: NotificationEntity = JSON.parse(data);
            notification.isRead = true;
            notification.updatedAt = new Date();
            await this.redis.set(`notification:${notificationId}`, JSON.stringify(notification));
        }
    }
}