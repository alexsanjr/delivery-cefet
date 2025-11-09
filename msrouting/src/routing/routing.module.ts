import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RedisFallbackModule as RedisModule } from '../redis/redis-fallback.module';
import { RoutingService } from './services/routing.service';
import { RoutingServiceLogger } from './services/routing.service.logger';
import { RouteOptimizerService } from './services/route-optimizer.service';
import { ExternalMapsClient } from './clients/external-maps.client';
import { EcoFriendlyRouteStrategy } from './strategies/eco-friendly.strategy';
import { EconomicalRouteStrategy } from './strategies/economical-route.strategy';
import { FastestRouteStrategy } from './strategies/fastest-route.strategy';
import { ShortestRouteStrategy } from './strategies/shortest-route.strategy';
import { RoutingResolver } from './resolvers/routing.resolver';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    RedisModule,
  ],
  providers: [
    // Base service (sem logging)
    {
      provide: 'IRoutingService.Base',
      useClass: RoutingService,
    },
    // Service com Decorator Pattern para logging
    {
      provide: RoutingService,
      useClass: RoutingServiceLogger,
    },
    RouteOptimizerService,
    ExternalMapsClient,
    EcoFriendlyRouteStrategy,
    EconomicalRouteStrategy,
    FastestRouteStrategy,
    ShortestRouteStrategy,
    RoutingResolver,
  ],
  exports: [RoutingService],
})
export class RoutingModule implements OnModuleInit {
  private readonly logger = new Logger(RoutingModule.name);

  constructor() {
    this.logger.log('🔄 RoutingModule constructor called');
  }

  onModuleInit() {
    this.logger.log('✅ RoutingModule initialized with Decorator Pattern logging');
  }
}