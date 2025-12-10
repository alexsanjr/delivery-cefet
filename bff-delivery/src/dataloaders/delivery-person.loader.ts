import DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { DeliveryServiceImpl } from '../delivery/delivery.service';
import { DeliveryPerson } from '../delivery/models/delivery.model';
import { lastValueFrom } from 'rxjs';

/**
 * DataLoader para DeliveryPerson - faz batching de chamadas gRPC
 * Evita o problema N+1 quando múltiplas deliveries precisam buscar seus deliveryPersons
 */
@Injectable({ scope: Scope.REQUEST })
export class DeliveryPersonLoader {
  private readonly loader: DataLoader<number, DeliveryPerson | null>;

  constructor(private readonly deliveryService: DeliveryServiceImpl) {
    this.loader = new DataLoader<number, DeliveryPerson | null>(
      async (ids: readonly number[]) => {
        return this.batchLoadDeliveryPersons(ids);
      },
      {
        cache: true, // Cache dentro do mesmo request
        maxBatchSize: 100, // Máximo de IDs por batch
      },
    );
  }

  /**
   * Carrega um único DeliveryPerson por ID
   * Se múltiplas chamadas forem feitas no mesmo tick, serão agrupadas em batch
   */
  async load(id: number): Promise<DeliveryPerson | null> {
    if (!id) return null;
    return this.loader.load(id);
  }

  /**
   * Carrega múltiplos DeliveryPersons por IDs
   */
  async loadMany(ids: number[]): Promise<(DeliveryPerson | null)[]> {
    const validIds = ids.filter((id) => id != null);
    if (validIds.length === 0) return [];
    
    const results = await this.loader.loadMany(validIds);
    return results.map((result) => (result instanceof Error ? null : result));
  }

  /**
   * Limpa o cache para um ID específico
   */
  clear(id: number): this {
    this.loader.clear(id);
    return this;
  }

  /**
   * Limpa todo o cache
   */
  clearAll(): this {
    this.loader.clearAll();
    return this;
  }

  /**
   * Batch loading: busca todos os DeliveryPersons de uma vez
   * Isso é chamado internamente pelo DataLoader quando há múltiplas requisições
   */
  private async batchLoadDeliveryPersons(
    ids: readonly number[],
  ): Promise<(DeliveryPerson | null)[]> {
    console.log(`[DeliveryPersonLoader] Batch loading ${ids.length} delivery persons: [${ids.join(', ')}]`);

    // Buscar todos os entregadores de uma vez
    // Idealmente o gRPC teria um método BatchGetDeliveryPersons
    // Por enquanto, fazemos chamadas paralelas com Promise.all
    const promises = ids.map(async (id) => {
      try {
        const result = await lastValueFrom(
          this.deliveryService.getDeliveryPerson(id),
        );
        return result.success ? result.deliveryPerson : null;
      } catch (error) {
        console.error(`[DeliveryPersonLoader] Error loading id ${id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);

    // Garantir que os resultados estejam na mesma ordem dos IDs
    const deliveryPersonMap = new Map<number, DeliveryPerson>();
    results.forEach((dp) => {
      if (dp) {
        deliveryPersonMap.set(dp.id, dp);
      }
    });

    return ids.map((id) => deliveryPersonMap.get(id) || null);
  }
}
