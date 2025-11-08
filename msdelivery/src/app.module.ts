import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { DeliveryPersonsModule } from './delivery-persons/delivery-persons.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { GrpcModule } from './grpc/grpc.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      introspection: true,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      context: ({ req }) => ({ req }),
    }),
    
    PrismaModule,
    GrpcModule,
    DeliveryPersonsModule,
    DeliveriesModule,
  ],
})
export class AppModule {}
