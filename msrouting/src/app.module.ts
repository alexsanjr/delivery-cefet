// src/app.module.ts - ADICIONE ESTAS 2 LINHAS
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CacheModule } from '@nestjs/cache-manager'; // ← LINHA 1: IMPORTAR
import { RoutingModule } from './routing/routing.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
    }),
    CacheModule.register(), // ← LINHA 2: ADICIONAR
    RoutingModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}