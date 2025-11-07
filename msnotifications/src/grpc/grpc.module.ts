import { Module } from '@nestjs/common';
import { GrpcNotificationsService } from './grpc.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [NotificationsModule],
    controllers: [GrpcNotificationsService],
})
export class GrpcModule {}
