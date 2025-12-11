export class TrackingPosition {
    constructor(
        public readonly id: string,
        public readonly deliveryId: string,
        public readonly orderId: string,
        public readonly latitude: number,
        public readonly longitude: number,
        public readonly deliveryPersonId: string,
        public readonly timestamp: Date,
        public status: string,
    ) {}

    isActive(): boolean {
        return this.status === 'active';
    }

    markAsInactive(): void {
        this.status = 'inactive';
    }

    distanceTo(other: TrackingPosition): number {
        const R = 6371;
        const dLat = this.toRad(other.latitude - this.latitude);
        const dLon = this.toRad(other.longitude - this.longitude);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(this.latitude)) * Math.cos(this.toRad(other.latitude)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}
