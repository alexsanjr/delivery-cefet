import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

@Resolver('OrderItem')
export class OrderItemResolver {
  @ResolveField('name')
  getName(@Parent() item: any): string | null {
    // Map productName from domain entity to name in GraphQL
    return item.productName || item.name || null;
  }

  @ResolveField('description')
  async getDescription(@Parent() item: any): Promise<string | null> {
    if (item.description) return item.description;
    if (item._description) return item._description;

    return null;
  }

  @ResolveField('price')
  getPrice(@Parent() item: any): number | null {
    if (item.unitPrice !== undefined && item.unitPrice !== null) {
      if (typeof item.unitPrice === 'object' && 'amount' in item.unitPrice) {
        return Number(item.unitPrice.amount);
      }
      return Number(item.unitPrice);
    }
    if (item.price !== undefined && item.price !== null) {
      return Number(item.price);
    }
    if (
      item._unitPrice &&
      typeof item._unitPrice === 'object' &&
      'amount' in item._unitPrice
    ) {
      return Number(item._unitPrice.amount);
    }
    return null;
  }
}
