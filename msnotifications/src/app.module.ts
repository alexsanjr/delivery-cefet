import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { RedisModule } from '@nestjs-modules/ioredis';
import { NotificationsModule } from './notifications/notifications.module';
import { GrpcModule } from './grpc/grpc.module';
import { GraphQLNotificationsModule } from './graphql/graphql.module';

@Module({
    imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: true,
            playground: true,
            introspection: true,
            csrfPrevention: false,
            sortSchema: true,
        }),
        RedisModule.forRoot({
            type: 'single',
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        }),
        NotificationsModule,
        GrpcModule,
        GraphQLNotificationsModule,
    ],
})
export class AppModule {}

