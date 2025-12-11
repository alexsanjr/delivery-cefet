export class ETA {
    constructor(
        public readonly estimatedArrival: Date,
        public readonly distanceRemaining: number,
        public readonly timeRemaining: number,
    ) {
        this.validate();
    }

    private validate(): void {
        if (this.distanceRemaining < 0) {
            throw new Error('Distance remaining cannot be negative');
        }
        if (this.timeRemaining < 0) {
            throw new Error('Time remaining cannot be negative');
        }
    }

    isArriving(): boolean {
        return this.distanceRemaining < 0.5;
    }

    getMinutesRemaining(): number {
        return Math.ceil(this.timeRemaining / 60);
    }

    getFormattedTime(): string {
        const minutes = this.getMinutesRemaining();
        if (minutes < 60) {
            return `${minutes} min`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}min`;
    }
}
