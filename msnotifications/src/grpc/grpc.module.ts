import { Module } from '@nestjs/common';
import { GrpcNotificationsService } from './grpc.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [NotificationsModule],
    providers: [GrpcNotificationsService],
    exports: [GrpcNotificationsService],
})
export class GrpcModule {}
