import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { NotificationsModule } from './notifications/notifications.module';
import { GrpcModule } from './grpc/grpc.module';

@Module({
    imports: [
        RedisModule.forRoot({
            type: 'single',
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        }),
        NotificationsModule,
        GrpcModule,
    ],
})
export class AppModule {}

