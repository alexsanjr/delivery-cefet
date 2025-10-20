import { Injectable } from '@nestjs/common';
import { IPriceCalculator, OrderItem, OrderAddress } from '../interfaces';

@Injectable()
export class ExpressPriceCalculator implements IPriceCalculator {
  calculateSubtotal(items?: OrderItem[]): number {
    const basicSubtotal = this.getBasicSubtotal(items);

    // Taxa de urgência de 20%
    return basicSubtotal * 1.2;
  }

  calculateDeliveryFee(address?: OrderAddress): number {
    // Taxa mais alta mas entrega garantida
    const distance = address?.distance || 0;

    if (distance <= 5) {
      return 15.0;
    }

    return 15.0 + distance * 1.5; // Taxa progressiva
  }

  calculateDeliveryTime(address?: OrderAddress): number {
    // Entrega mais rápida possível
    const baseTime = 15; // Tempo mínimo
    const distance = address?.distance || 0;
    const extraTime = Math.ceil(distance / 5) * 2; // Muito eficiente

    return Math.min(baseTime + extraTime, 25); // Máximo 25 min
  }

  private getBasicSubtotal(items?: OrderItem[]): number {
    if (!items || items.length === 0) {
      return 100.0;
    }

    return items.reduce((total, item) => {
      const itemPrice = Number(item.price) || 0;
      const itemQuantity = Number(item.quantity) || 1;
      return total + itemPrice * itemQuantity;
    }, 0);
  }
}
