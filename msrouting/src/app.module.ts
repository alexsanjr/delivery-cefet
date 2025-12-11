import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GrpcModule } from './presentation/grpc/grpc.module';
import { GraphQLModule as RoutingGraphQLModule } from './presentation/graphql/graphql.module';
import { ApplicationModule } from './application/application.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { RabbitMQModule } from './infrastructure/messaging/rabbitmq.module';

/**
 * Módulo raiz: Arquitetura Hexagonal com DDD
 *
 * Estrutura em camadas:
 * - Domain: Entidades, Value Objects, Interfaces de Repositórios, Events
 * - Application: Use Cases, DTOs, Mappers
 * - Infrastructure: Implementações (Redis, API Externa, RabbitMQ + Protobuf)
 * - Presentation: Adapters gRPC e GraphQL
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule.register(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: true,
      introspection: true,
      autoSchemaFile: true,
      sortSchema: true,
    }),
    // Camadas da Arquitetura Hexagonal
    RabbitMQModule,
    InfrastructureModule,
    ApplicationModule,
    GrpcModule,
    RoutingGraphQLModule,
  ],
  providers: [],
})
export class AppModule {}