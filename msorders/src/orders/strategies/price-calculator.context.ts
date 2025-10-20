import { Injectable } from '@nestjs/common';
import {
  IPriceCalculator,
  PriceStrategy,
  OrderItem,
  OrderAddress,
} from '../interfaces';
import { BasicPriceCalculator } from '../strategies/basic-price-calculator.strategy';
import { PremiumPriceCalculator } from '../strategies/premium-price-calculator.strategy';
import { ExpressPriceCalculator } from '../strategies/express-price-calculator.strategy';

@Injectable()
export class PriceCalculatorContext {
  private strategies: Map<PriceStrategy, IPriceCalculator>;

  constructor(
    private readonly basicCalculator: BasicPriceCalculator,
    private readonly premiumCalculator: PremiumPriceCalculator,
    private readonly expressCalculator: ExpressPriceCalculator,
  ) {
    this.strategies = new Map([
      [PriceStrategy.BASIC, this.basicCalculator],
      [PriceStrategy.PREMIUM, this.premiumCalculator],
      [PriceStrategy.EXPRESS, this.expressCalculator],
    ]);
  }

  calculateSubtotal(strategy: PriceStrategy, items?: OrderItem[]): number {
    const calculator = this.getCalculator(strategy);
    return calculator.calculateSubtotal(items);
  }

  calculateDeliveryFee(
    strategy: PriceStrategy,
    address?: OrderAddress,
  ): number {
    const calculator = this.getCalculator(strategy);
    return calculator.calculateDeliveryFee(address);
  }

  calculateDeliveryTime(
    strategy: PriceStrategy,
    address?: OrderAddress,
  ): number {
    const calculator = this.getCalculator(strategy);
    return calculator.calculateDeliveryTime(address);
  }

  private getCalculator(strategy: PriceStrategy): IPriceCalculator {
    const calculator = this.strategies.get(strategy);
    if (!calculator) {
      throw new Error(`Strategy ${strategy} not found`);
    }
    return calculator;
  }
}
