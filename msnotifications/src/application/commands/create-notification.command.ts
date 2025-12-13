export class CreateNotificationCommand {
    constructor(
        public readonly userId: string,
        public readonly orderId: string,
        public readonly status: string,
        public readonly serviceOrigin: string,
        public readonly message?: string,
    ) {}
}
