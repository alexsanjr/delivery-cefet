import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export interface RouteCacheData {
  path: Array<{ latitude: number; longitude: number }>;
  total_distance: number;
  total_duration: number;
  polyline: string;
  cost_estimate: number;
  steps: any[];
}

export interface OptimizedRouteCacheData {
  vehicle_routes: any[];
  total_cost: number;
  total_distance: number;
  total_duration: number;
}

// Wrapper genérico para operações com Redis
@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cache.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key);
  }

  async getRouteCache(key: string): Promise<RouteCacheData | undefined> {
    return this.get(`route:${key}`);
  }

  async setRouteCache(
    key: string,
    route: RouteCacheData,
    ttl = 3600,
  ): Promise<void> {
    await this.set(`route:${key}`, route, ttl);
  }

  async getOptimizedRouteCache(
    routeHash: string,
  ): Promise<OptimizedRouteCacheData | undefined> {
    return this.get(`optimized_route:${routeHash}`);
  }

  async setOptimizedRouteCache(
    routeHash: string,
    route: OptimizedRouteCacheData,
    ttl = 7200,
  ): Promise<void> {
    await this.set(`optimized_route:${routeHash}`, route, ttl);
  }

  generateRouteKey(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    strategy: string,
  ): string {
    return `${origin.latitude.toFixed(6)}:${origin.longitude.toFixed(6)}:${destination.latitude.toFixed(6)}:${destination.longitude.toFixed(6)}:${strategy}`;
  }

  generateOptimizedRouteKey(
    depot: { latitude: number; longitude: number },
    deliveries: any[],
  ): string {
    const deliveriesHash = deliveries
      .map(
        (d) =>
          `${d.location.latitude.toFixed(6)}:${d.location.longitude.toFixed(6)}`,
      )
      .sort()
      .join('|');
    return `${depot.latitude.toFixed(6)}:${depot.longitude.toFixed(6)}:${deliveriesHash}`;
  }

  async healthCheck(): Promise<{ status: string; responseTime?: number }> {
    const start = Date.now();
    try {
      await this.get('health-check');
      return { status: 'healthy', responseTime: Date.now() - start };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }
}
