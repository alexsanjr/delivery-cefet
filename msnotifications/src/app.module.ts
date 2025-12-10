import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { NotificationsModule } from './application/application.module';
import { GrpcModule } from './presentation/grpc/grpc.module';
import { GraphQLNotificationsModule } from './presentation/graphql/graphql.module';

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
        NotificationsModule,
        GrpcModule,
        GraphQLNotificationsModule,
    ],
})
export class AppModule {}

