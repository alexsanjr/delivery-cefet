import { Injectable } from '@nestjs/common';
import { INotificationObserver, NotificationData, IConnectedClient } from '../interfaces';

@Injectable()
export class TerminalNotifierObserver implements INotificationObserver {
    private connectedClients: Map<string, IConnectedClient> = new Map();

    connectClient(userId: string): void {
        this.connectedClients.set(userId, {
            userId,
            connectedAt: new Date(),
        });
        console.log(`\n[SYSTEM] Cliente ${userId} conectado ao sistema de notificacoes`);
    }

    disconnectClient(userId: string): void {
        if (this.connectedClients.has(userId)) {
            this.connectedClients.delete(userId);
            console.log(`\n[SYSTEM] Cliente ${userId} desconectado do sistema de notificacoes`);
        }
    }

    getConnectedClients(): string[] {
        return Array.from(this.connectedClients.keys());
    }

    async update(notification: NotificationData): Promise<void> {
        if (!this.connectedClients.has(notification.userId)) {
            return;
        }

        const timestamp = new Date().toISOString();
        
        console.log('\n' + '='.repeat(80));
        console.log(`[NOTIFICACAO] ${timestamp}`);
        console.log('='.repeat(80));
        console.log(`ID do Pedido: ${notification.orderId}`);
        console.log(`ID do Usuario: ${notification.userId}`);
        console.log(`Status: ${notification.status}`);
        console.log(`Servico de Origem: ${notification.serviceOrigin}`);
        if (notification.additionalInfo) {
            console.log(`Informacoes Adicionais: ${notification.additionalInfo}`);
        }
        console.log('-'.repeat(80));
        console.log(`Mensagem: ${notification.message}`);
        console.log('='.repeat(80) + '\n');
    }
}
