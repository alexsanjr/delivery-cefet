export class Position {
    constructor(
        public readonly latitude: number,
        public readonly longitude: number,
    ) {
        this.validate();
    }

    private validate(): void {
        if (this.latitude < -90 || this.latitude > 90) {
            throw new Error('Invalid latitude: must be between -90 and 90');
        }
        if (this.longitude < -180 || this.longitude > 180) {
            throw new Error('Invalid longitude: must be between -180 and 180');
        }
    }

    distanceTo(other: Position): number {
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

    equals(other: Position): boolean {
        return this.latitude === other.latitude && this.longitude === other.longitude;
    }
}
