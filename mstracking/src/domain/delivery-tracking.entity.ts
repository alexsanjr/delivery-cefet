export class DeliveryTracking {
    constructor(
        public readonly id: string,
        public readonly deliveryId: string,
        public readonly orderId: string,
        public readonly startedAt: Date,
        public completedAt: Date | null,
        public status: string,
        public readonly destinationLat: number,
        public readonly destinationLng: number,
    ) {}

    isInTransit(): boolean {
        return this.status === 'in_transit';
    }

    isDelivered(): boolean {
        return this.status === 'delivered';
    }

    isPending(): boolean {
        return this.status === 'pending';
    }

    isFinalStatus(): boolean {
        return this.status === 'delivered' || this.status === 'cancelled';
    }

    markAsDelivered(): void {
        if (this.isFinalStatus()) {
            throw new Error('Cannot mark as delivered: tracking is already in final status');
        }
        this.status = 'delivered';
        this.completedAt = new Date();
    }

    markAsCancelled(): void {
        if (this.isFinalStatus()) {
            throw new Error('Cannot cancel: tracking is already in final status');
        }
        this.status = 'cancelled';
        this.completedAt = new Date();
    }

    startDelivery(): void {
        if (!this.isPending()) {
            throw new Error('Cannot start delivery: tracking is not in pending status');
        }
        this.status = 'in_transit';
    }
}
