import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { RabbitMQModule } from './infrastructure/messaging/rabbitmq.module';
import { GraphqlModule } from './presentation/graphql/graphql.module';
import { GrpcModule } from './presentation/grpc/grpc.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

// Módulo raiz: integra GraphQL, gRPC, RabbitMQ e configurações gerais
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: false,
      introspection: true,
      sortSchema: true,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
    PrismaModule,
    RabbitMQModule,
    GraphqlModule,
    GrpcModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
