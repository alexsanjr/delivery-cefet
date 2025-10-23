import { Injectable, OnModuleInit } from "@nestjs/common";
import { INotificationSubject, INotificationObserver, NotificationData } from "./interfaces";
import { NotificationsRepository } from "./notifications.repository";
import { CreateNotificationDto } from "./dto/notifications-create.dto";
import { NotificationEntity } from "../database/entities/notifications.entity";
import { TerminalNotifierObserver, NotificationLoggerObserver } from "./observers";

@Injectable()
export class NotificationsService implements INotificationSubject, OnModuleInit {
    private observers: INotificationObserver[] = [];

    constructor(
        private readonly notificationsRepository: NotificationsRepository,
        private readonly terminalNotifier: TerminalNotifierObserver,
        private readonly loggerNotifier: NotificationLoggerObserver,
    ) {}

    onModuleInit() {
        this.subscribe(this.terminalNotifier);
        this.subscribe(this.loggerNotifier);
    }

    subscribe(observer: INotificationObserver): void {
        this.observers.push(observer);
    }

    unsubscribe(observer: INotificationObserver): void {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    async notify(notification: NotificationData): Promise<void> {
        const promises = this.observers.map(observer => observer.update(notification));
        await Promise.all(promises);
    }

    async createNotification(createDto: CreateNotificationDto): Promise<NotificationEntity> {
        const message = createDto.message || this.generateMessage(createDto.status, createDto.orderId);
        const notification = await this.notificationsRepository.create({
            ...createDto,
            message,
        });
        const notificationData: NotificationData = {
            orderId: notification.orderId,
            userId: notification.userId,
            status: notification.status,
            message: notification.message,
            serviceOrigin: notification.serviceOrigin,
        };
        await this.notify(notificationData);
        return notification;
    }

    private generateMessage(status: string, orderId: string): string {
        switch (status) {
            case 'CONFIRMED':
                return `Pedido #${orderId} confirmado! Preparando para envio.`;
            case 'PREPARING':
                return `Pedido #${orderId} esta sendo preparado na cozinha.`;
            case 'OUT_FOR_DELIVERY':
                return `Pedido #${orderId} saiu para entrega!`;
            case 'DELIVERED':
                return `Pedido #${orderId} foi entregue com sucesso!`;
            case 'CANCELLED':
                return `Pedido #${orderId} foi cancelado.`;
            default:
                return `Status do pedido #${orderId}: ${status}`;
        }
    }

    async getNotificationsByUserId(userId: string): Promise<NotificationEntity[]> {
        return await this.notificationsRepository.findByUserId(userId);
    }

    async getNotificationsByOrderId(orderId: string): Promise<NotificationEntity[]> {
        return await this.notificationsRepository.findByOrderId(orderId);
    }

    async markNotificationAsRead(notificationId: string): Promise<void> {
        await this.notificationsRepository.markAsRead(notificationId);
    }

    connectClient(userId: string): void {
        this.terminalNotifier.connectClient(userId);
    }

    disconnectClient(userId: string): void {
        this.terminalNotifier.disconnectClient(userId);
    }

    getConnectedClients(): string[] {
        return this.terminalNotifier.getConnectedClients();
    }
}