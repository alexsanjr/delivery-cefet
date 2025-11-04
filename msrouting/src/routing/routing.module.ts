// src/routing/routing.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module'; // ← IMPORTAR AQUI
import { RoutingResolver } from './resolvers/routing.resolver';
import { RoutingService } from './services/routing.service';
import { RouteOptimizerService } from './services/route-optimizer.service';
import { PrismaService } from '../prisma/prisma.service';
// REMOVER import do RedisService daqui
import { ExternalMapsClient } from '../grpc/clients/external-maps.client';
import { EcoFriendlyRouteStrategy } from './strategies/eco-friendly.strategy';
import { EconomicalRouteStrategy } from './strategies/economical-route.strategy';
import { FastestRouteStrategy } from './strategies/fastest-route.strategy';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    RedisModule, // ← USAR RedisModule em vez de CacheModule direto
  ],
  providers: [
    RoutingResolver,
    RoutingService,
    RouteOptimizerService,
    PrismaService,
    // REMOVER RedisService daqui
    ExternalMapsClient,
    EcoFriendlyRouteStrategy,
    EconomicalRouteStrategy,
    FastestRouteStrategy,
  ],
  exports: [RoutingService],
})
export class RoutingModule {}