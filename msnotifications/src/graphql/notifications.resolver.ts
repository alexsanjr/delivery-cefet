import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { NotificationsService } from '../notifications/notifications.service';
import { Notification } from './notifications.schema';

@Resolver(() => Notification)
export class NotificationsResolver {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Query(() => [Notification], { 
        name: 'notificationsByUser',
        description: 'Buscar todas as notificacoes de um usuario' 
    })
    async getNotificationsByUser(
        @Args('userId') userId: string
    ): Promise<Notification[]> {
        return await this.notificationsService.getNotificationsByUserId(userId);
    }

    @Query(() => [Notification], { 
        name: 'notificationsByOrder',
        description: 'Buscar todas as notificacoes de um pedido' 
    })
    async getNotificationsByOrder(
        @Args('orderId') orderId: string
    ): Promise<Notification[]> {
        return await this.notificationsService.getNotificationsByOrderId(orderId);
    }

    @Query(() => [String], {
        name: 'connectedClients',
        description: 'Listar todos os clientes conectados'
    })
    async getConnectedClients(): Promise<string[]> {
        return this.notificationsService.getConnectedClients();
    }

    @Mutation(() => Boolean, {
        name: 'markNotificationAsRead',
        description: 'Marca uma notificacao como lida'
    })
    async markAsRead(
        @Args('notificationId') notificationId: string
    ): Promise<boolean> {
        try {
            await this.notificationsService.markNotificationAsRead(notificationId);
            return true;
        } catch (error) {
            return false;
        }
    }
}