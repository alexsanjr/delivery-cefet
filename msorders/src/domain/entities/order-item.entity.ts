import { DomainException } from '../../shared/exceptions';
import { Entity } from '../../shared/interfaces';
import { Money } from '../value-objects/money.vo';

export interface OrderItemProps {
  id?: number;
  productId: number;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: Money;
  notes?: string;
}

export class OrderItem extends Entity<number> {
  private readonly _productId: number;
  private readonly _productName: string;
  private readonly _description?: string;
  private readonly _quantity: number;
  private readonly _unitPrice: Money;
  private readonly _notes?: string;

  private constructor(props: OrderItemProps) {
    super(props.id!);
    this._productId = props.productId;
    this._productName = props.productName;
    this._description = props.description;
    this._quantity = props.quantity;
    this._unitPrice = props.unitPrice;
    this._notes = props.notes;
  }

  static create(props: OrderItemProps): OrderItem {
    if (!props.productName || props.productName.trim().length === 0) {
      throw new DomainException('Product name is required');
    }

    if (props.quantity <= 0) {
      throw new DomainException('Quantity must be greater than zero');
    }

    if (props.unitPrice.amount <= 0) {
      throw new DomainException('Unit price must be greater than zero');
    }

    return new OrderItem(props);
  }

  static reconstitute(
    id: number,
    props: Omit<OrderItemProps, 'id'>,
  ): OrderItem {
    return new OrderItem({ ...props, id });
  }

  get productId(): number {
    return this._productId;
  }

  get productName(): string {
    return this._productName;
  }

  get description(): string | undefined {
    return this._description;
  }

  get quantity(): number {
    return this._quantity;
  }

  get unitPrice(): Money {
    return this._unitPrice;
  }

  get notes(): string | undefined {
    return this._notes;
  }

  get subtotal(): Money {
    return this._unitPrice.multiply(this._quantity);
  }

  toJSON() {
    return {
      id: this.id,
      productName: this.productName,
      description: this.description,
      quantity: this.quantity,
      unitPrice: this.unitPrice.amount,
      notes: this.notes,
      subtotal: this.subtotal.amount,
    };
  }
}
