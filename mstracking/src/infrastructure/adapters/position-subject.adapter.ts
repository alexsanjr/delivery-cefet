import { Injectable, OnModuleInit } from '@nestjs/common';
import type { PositionSubjectPort, PositionObserverPort } from '../../domain/ports/position-observer.port';
import { TrackingPosition } from '../../domain/tracking-position.entity';
import { PositionLoggerObserver } from './position-logger.observer';

@Injectable()
export class PositionSubjectAdapter implements PositionSubjectPort, OnModuleInit {
    private observers: PositionObserverPort[] = [];

    constructor(private readonly positionLoggerObserver: PositionLoggerObserver) {}

    onModuleInit() {
        this.attach(this.positionLoggerObserver);
    }

    attach(observer: PositionObserverPort): void {
        if (!this.observers.includes(observer)) {
            this.observers.push(observer);
        }
    }

    detach(observer: PositionObserverPort): void {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    notify(position: TrackingPosition): void {
        this.observers.forEach(observer => observer.update(position));
    }
}
