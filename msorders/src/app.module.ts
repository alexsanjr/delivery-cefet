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
// Consumers Module
import { ConsumersModule } from './infrastructure/consumers/consumers.module';

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
        { name: 'customer.events', type: 'topic', options: { durable: true } },
        { name: 'orders.events', type: 'topic', options: { durable: true } },
      ],
      queues: [
        // Event-driven: Sincronização de cache
        {
          name: 'orders.customers.queue',
          exchange: 'customer.events',
          routingKey: 'customer.*',
          options: { durable: true },
        },
        // Request-Reply: Validação e busca de clientes
        {
          name: 'customers.validate.queue',
          options: { durable: true },
        },
        {
          name: 'customers.get.queue',
          options: { durable: true },
        },
        // Notificações
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
    // Consumers que processam eventos
    ConsumersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
