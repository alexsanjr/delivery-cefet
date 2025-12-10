import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { TrackingInfrastructureModule } from './infrastructure/infrastructure.module';
import { TrackingApplicationModule } from './application/application.module';
import { GrpcPresentationModule } from './presentation/grpc/grpc.module';
import { GraphQLPresentationModule } from './presentation/graphql/graphql.module';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [__dirname + '/infrastructure/persistence/*.orm{.ts,.js}'],
            synchronize: true,
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            playground: true,
            introspection: true,
            csrfPrevention: false,
            installSubscriptionHandlers: true,
            subscriptions: {
                'graphql-ws': true,
            },
        }),
        TrackingInfrastructureModule,
        TrackingApplicationModule,
        GrpcPresentationModule,
        GraphQLPresentationModule,
    ],
})
export class AppModule {}