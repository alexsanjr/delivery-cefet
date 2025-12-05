import { Injectable } from '@nestjs/common';
import { Money } from '../value-objects/money.vo';
import { Address } from '../value-objects/address.vo';

/**
 * Domain Service para cálculo de taxa de entrega
 * Regras de negócio que não pertencem a nenhum agregado específico
 */
@Injectable()
export class DeliveryFeeCalculator {
  private readonly BASE_FEE = 5.0; // Taxa base em BRL
  private readonly PRICE_PER_KM = 2.5; // Preço por quilômetro

  /**
   * Calcula a taxa de entrega baseada na distância
   * @param distance - Distância em quilômetros
   * @returns Taxa de entrega como Money value object
   */
  calculateByDistance(distance: number): Money {
    if (distance < 0) {
      throw new Error('Distance cannot be negative');
    }

    const totalFee = this.BASE_FEE + distance * this.PRICE_PER_KM;
    return Money.create(totalFee, 'BRL');
  }

  /**
   * Calcula a taxa de entrega baseada no endereço
   * Se o endereço tiver coordenadas, pode ser usado para cálculo de rota
   * Por enquanto, retorna taxa base se não houver coordenadas
   * 
   * @param address - Endereço de entrega
   * @param restaurantLatitude - Latitude do restaurante (opcional)
   * @param restaurantLongitude - Longitude do restaurante (opcional)
   * @returns Taxa de entrega como Money value object
   */
  calculateByAddress(
    address: Address,
    restaurantLatitude?: number,
    restaurantLongitude?: number,
  ): Money {
    // Se não tiver coordenadas, usar taxa base
    if (!address.hasCoordinates() || !restaurantLatitude || !restaurantLongitude) {
      return Money.create(this.BASE_FEE, 'BRL');
    }

    // Calcular distância usando fórmula de Haversine
    const distance = this.calculateHaversineDistance(
      restaurantLatitude,
      restaurantLongitude,
      address.latitude!,
      address.longitude!,
    );

    return this.calculateByDistance(distance);
  }

  /**
   * Calcula distância entre dois pontos usando fórmula de Haversine
   * @returns Distância em quilômetros
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Aplica desconto na taxa de entrega
   * Útil para promoções ou clientes VIP
   */
  applyDiscount(fee: Money, discountPercentage: number): Money {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error('Discount percentage must be between 0 and 100');
    }

    const discountFactor = 1 - discountPercentage / 100;
    return Money.create(fee.amount * discountFactor, fee.currency);
  }
}
