import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApplicationModule } from './application/application.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { GraphqlModule } from './presentation/graphql/graphql.module';
import { GrpcModule } from './presentation/grpc/grpc.module';

/**
 * Módulo raiz: Arquitetura Hexagonal com DDD
 *
 * Estrutura em camadas:
 * - Domain: Entidades, Value Objects, Interfaces, Events
 * - Application: Use Cases, DTOs, Mappers
 * - Infrastructure: Implementações (Prisma, RabbitMQ + Protobuf)
 * - Presentation: Adapters gRPC e GraphQL
 */
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
    InfrastructureModule,
    ApplicationModule,
    GraphqlModule,
    GrpcModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
