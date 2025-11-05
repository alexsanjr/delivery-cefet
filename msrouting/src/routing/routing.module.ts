import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RedisFallbackModule as RedisModule } from '../redis/redis-fallback.module';
import { RoutingService } from './services/routing.service';
import { RouteOptimizerService } from './services/route-optimizer.service';
import { ExternalMapsClient } from '../grpc/clients/external-maps.client';
import { EcoFriendlyRouteStrategy } from './strategies/eco-friendly.strategy';
import { EconomicalRouteStrategy } from './strategies/economical-route.strategy';
import { FastestRouteStrategy } from './strategies/fastest-route.strategy';
import { ShortestRouteStrategy } from './strategies/shortest-route.strategy';
import { RoutingGrpcService } from '../grpc/services/routing.grpc.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    RedisModule,
  ],
  controllers: [RoutingGrpcService],
  providers: [
    RoutingService,
    RouteOptimizerService,
    ExternalMapsClient,
    EcoFriendlyRouteStrategy,
    EconomicalRouteStrategy,
    FastestRouteStrategy,
    ShortestRouteStrategy,
  ],
  exports: [RoutingService],
})
export class RoutingModule implements OnModuleInit {
  private readonly logger = new Logger(RoutingModule.name);

  constructor() {
    this.logger.log('🔄 RoutingModule constructor called');
  }

  onModuleInit() {
    this.logger.log('✅ RoutingModule initialized with gRPC services');
  }
}