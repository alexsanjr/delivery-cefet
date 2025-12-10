import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './orders/orders.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ProductModule } from './product/product.module';
import { GrpcOrdersModule } from './grpc/grpc-orders.module';
// Hexagonal Architecture Modules
import { GraphQLModule as HexagonalGraphQLModule } from './infrastructure/graphql/graphql.module';
// RabbitMQ Module
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: false,
      introspection: true,
      sortSchema: true,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      typePaths: ['./**/*.graphql'],
    }),
    // RabbitMQ with Protobuf serialization
    RabbitMQModule.forRoot({
      url: process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672',
      exchanges: [
        { name: 'orders.events', type: 'topic', options: { durable: true } },
      ],
      queues: [
        {
          name: 'notifications.queue',
          exchange: 'orders.events',
          routingKey: 'order.*',
          options: { durable: true },
        },
      ],
    }),
    OrdersModule,
    ProductModule,
    GrpcOrdersModule,
    // Hexagonal Architecture
    HexagonalGraphQLModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
