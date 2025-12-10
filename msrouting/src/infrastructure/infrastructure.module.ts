import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './cache/redis.module';
import { RabbitMQModule } from './messaging/rabbitmq.module';
import { RepositorioRedisRota } from './persistence/redis-rota.repository';
import { GeoapifyAPIAdapter } from './external/geoapify-api.adapter';
import {
  TOKEN_REPOSITORIO_ROTA,
  TOKEN_SERVICO_API_MAPAS,
} from '../domain/repositories/injection-tokens';

// Módulo com implementações de adapters (Redis, Geoapify, RabbitMQ)
@Module({
  imports: [RedisModule, RabbitMQModule, HttpModule, ConfigModule],
  providers: [
    {
      provide: TOKEN_REPOSITORIO_ROTA,
      useClass: RepositorioRedisRota,
    },
    {
      provide: TOKEN_SERVICO_API_MAPAS,
      useClass: GeoapifyAPIAdapter,
    },
  ],
  exports: [TOKEN_REPOSITORIO_ROTA, TOKEN_SERVICO_API_MAPAS],
})
export class InfrastructureModule {}
