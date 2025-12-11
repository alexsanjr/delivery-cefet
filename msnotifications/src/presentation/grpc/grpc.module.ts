import { Module } from '@nestjs/common';
import { GrpcNotificationsService } from './grpc.service';
import { NotificationsApplicationModule } from '../../application/application.module';

@Module({
    imports: [NotificationsApplicationModule],
    controllers: [GrpcNotificationsService],
})
export class GrpcModule {}
