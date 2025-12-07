import { Injectable } from '@nestjs/common';
import type { ClientConnectionPort } from '../../domain/ports/client-connection.port';

@Injectable()
export class ManageClientConnectionUseCase {
    constructor(
        private readonly clientConnection: ClientConnectionPort,
    ) {}

    connectClient(userId: string): void {
        this.clientConnection.connectClient(userId);
    }

    disconnectClient(userId: string): void {
        this.clientConnection.disconnectClient(userId);
    }

    getConnectedClients(): string[] {
        return this.clientConnection.getConnectedClients();
    }
}