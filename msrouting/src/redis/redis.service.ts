import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

export interface RouteCacheData {
    path: Array<{ latitude: number; longitude: number }>;
    total_distance: number;
    total_duration: number;
    polyline: string;
    cost_estimate: number;
}

export interface OptimizedRouteCacheData {
    vehicle_routes: any[];
    total_cost: number;
    total_distance: number;
    total_duration: number;
}

@Injectable()
export class RedisService {
    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: any) {}

    async get<T = any>(key: string): Promise<T | null> {
        return this.cacheManager.get(key);
    }

    async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
        await this.cacheManager.set(key, value, ttl);
    }

    async del(key: string): Promise<void> {
        await this.cacheManager.del(key);
    }

    async getRouteCache(key: string): Promise<RouteCacheData | null> {
        return this.get(`route:${key}`);
    }

    async setRouteCache(key: string, route: RouteCacheData, ttl: number = 3600): Promise<void> {
        await this.set(`route:${key}`, route, ttl);
    }

    async getOptimizedRouteCache(routeHash: string): Promise<OptimizedRouteCacheData | null> {
        return this.get(`optimized_route:${routeHash}`);
    }

    async setOptimizedRouteCache(routeHash: string, route: OptimizedRouteCacheData, ttl: number = 7200): Promise<void> {
        await this.set(`optimized_route:${routeHash}`, route, ttl);
    }

    generateRouteKey(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }, strategy: string): string {
        return `${origin.lat.toFixed(6)}:${origin.lng.toFixed(6)}:${destination.lat.toFixed(6)}:${destination.lng.toFixed(6)}:${strategy}`;
    }

    generateOptimizedRouteKey(depot: { lat: number; lng: number }, deliveries: any[]): string {
        const deliveriesHash = deliveries
            .map(d => `${d.location.latitude.toFixed(6)}:${d.location.longitude.toFixed(6)}`)
            .join('|');
        return `${depot.lat.toFixed(6)}:${depot.lng.toFixed(6)}:${deliveriesHash}`;
    }

    async healthCheck(): Promise<{ status: string; responseTime?: number }> {
        const start = Date.now();
        try {
            await this.cacheManager.get('health-check');
            const responseTime = Date.now() - start;
            return { status: 'healthy', responseTime };
        } catch (error) {
            return { status: 'unhealthy' };
        }
    }
}