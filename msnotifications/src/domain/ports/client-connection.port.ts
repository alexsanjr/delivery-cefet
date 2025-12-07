export interface ClientConnectionPort {
    connectClient(userId: string): void;
    disconnectClient(userId: string): void;
    getConnectedClients(): string[];
}