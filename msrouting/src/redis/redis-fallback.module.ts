// src/redis/redis-fallback.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisService } from './redis.service';

/**
 * Fallback Redis Module usando cache-manager in-memory
 * Use este módulo se houver problemas com a configuração do Redis
 */
@Module({
  imports: [
    CacheModule.register({
      ttl: 3600, // 1 hora
      max: 1000, // máximo de itens no cache
      isGlobal: true,
    }),
  ],
  providers: [RedisService],
  exports: [CacheModule, RedisService],
})
export class RedisFallbackModule {}