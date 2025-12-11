import { TrackingPosition } from '../tracking-position.entity';

export interface PositionObserverPort {
    update(position: TrackingPosition): void;
}

export interface PositionSubjectPort {
    attach(observer: PositionObserverPort): void;
    detach(observer: PositionObserverPort): void;
    notify(position: TrackingPosition): void;
}
