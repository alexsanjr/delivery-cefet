import { Injectable, OnModuleInit } from '@nestjs/common';
import type { NotificationSubjectPort, NotificationObserverPort } from '../../domain/ports/notification-observer.port';
import type { NotificationData } from '../../domain/interfaces/notification-data.interface';
import { TerminalNotifierObserver } from './notifications-terminal.observer';
import { NotificationLoggerObserver } from './notifications-logger.observer';

@Injectable()
export class NotificationSubjectAdapter implements NotificationSubjectPort, OnModuleInit {
    private observers: NotificationObserverPort[] = [];

    constructor(
        private readonly terminalNotifier: TerminalNotifierObserver,
        private readonly loggerObserver: NotificationLoggerObserver,
    ) {}

    onModuleInit() {
        this.subscribe(this.terminalNotifier);
        this.subscribe(this.loggerObserver);
    }

    subscribe(observer: NotificationObserverPort): void {
        this.observers.push(observer);
    }

    unsubscribe(observer: NotificationObserverPort): void {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    async notify(notification: NotificationData): Promise<void> {
        const promises = this.observers.map(observer => observer.update(notification));
        await Promise.all(promises);
    }
}