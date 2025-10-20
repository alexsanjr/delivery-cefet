import { Injectable } from '@nestjs/common';
import { IPriceCalculator, OrderItem, OrderAddress } from '../interfaces';

@Injectable()
export class BasicPriceCalculator implements IPriceCalculator {
  calculateSubtotal(items?: OrderItem[]): number {
    if (!items || items.length === 0) {
      // Valor padrão quando não há items
      return 100.0;
    }

    return items.reduce((total, item) => {
      const itemPrice = item.price || 0;
      const itemQuantity = item.quantity || 1;
      return total + itemPrice * itemQuantity;
    }, 0);
  }

  calculateDeliveryFee(address?: OrderAddress): number {
    // Estratégia básica: taxa fixa
    const baseFee = 5.0;

    if (!address) {
      return baseFee;
    }

    // Adicionar taxa extra baseada na distância
    const distance = address.distance || 0;
    const extraFee = distance > 10 ? 3.0 : 0;

    return baseFee + extraFee;
  }

  calculateDeliveryTime(address?: OrderAddress): number {
    // Tempo base: 30 minutos
    const baseTime = 30;

    if (!address) {
      return baseTime;
    }

    // Adicionar tempo baseado na distância
    const distance = address.distance || 0;
    const extraTime = Math.ceil(distance / 2) * 5; // 5 min a cada 2km

    return baseTime + extraTime;
  }
}
