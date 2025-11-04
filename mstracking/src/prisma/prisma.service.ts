// src/shared/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'colorless',
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Prisma disconnected from database');
  }

  // Factory Pattern - Criar entidades com validação
  createTrackingPosition(data: {
    delivery_id: string;
    order_id: string;
    latitude: number;
    longitude: number;
    delivery_person_id: string;
  }) {
    return this.trackingPosition.create({
      data: {
        ...data,
        status: 'active',
      },
    });
  }

  // Repository Pattern - Métodos customizados
  async findRecentPositions(deliveryId: string, limit: number = 10) {
    return this.trackingPosition.findMany({
      where: { delivery_id: deliveryId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async findActiveDeliveries() {
    return this.deliveryTracking.findMany({
      where: {
        status: {
          in: ['pending', 'in_progress', 'in_transit'],
        },
      },
      include: {
        positions: {
          orderBy: { timestamp: 'desc' },
          take: 1, // Última posição
        },
      },
    });
  }

  // Decorator Pattern (simulado) - Logging de queries
  async executeWithLog<T>(operation: string, callback: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await callback();
      const duration = Date.now() - start;
      console.log(`[Prisma] ${operation} completed in ${duration}ms`);
      return result;
    } catch (error) {
      console.error(`[Prisma] ${operation} failed:`, error);
      throw error;
    }
  }
}