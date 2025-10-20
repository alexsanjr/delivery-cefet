import { Injectable } from '@nestjs/common';
import { IPriceCalculator, OrderItem, OrderAddress } from '../interfaces';

@Injectable()
export class PremiumPriceCalculator implements IPriceCalculator {
  calculateSubtotal(items?: OrderItem[]): number {
    const basicSubtotal = this.getBasicSubtotal(items);

    // 15% de desconto para pedidos acima de R$ 150
    if (basicSubtotal > 150) {
      return basicSubtotal * 0.85; // 15% desconto
    }

    return basicSubtotal;
  }

  calculateDeliveryFee(address?: OrderAddress): number {
    // Frete grátis para pedidos acima de R$ 100
    const distance = address?.distance || 0;

    if (distance <= 15) {
      return 0; // Frete grátis para clientes premium em área próxima
    }

    // Taxa reduzida para longas distâncias
    return 3.0;
  }

  calculateDeliveryTime(address?: OrderAddress): number {
    // Entrega mais rápida para clientes premium
    const baseTime = 20; // 10 min a menos que básico
    const distance = address?.distance || 0;
    const extraTime = Math.ceil(distance / 3) * 3; // Mais eficiente

    return baseTime + extraTime;
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
