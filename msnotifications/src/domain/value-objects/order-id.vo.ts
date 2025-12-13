export class OrderId {
    private readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    static create(value: string): OrderId {
        if (!value || value.trim().length === 0) {
            throw new Error('OrderId cannot be empty');
        }
        return new OrderId(value);
    }

    getValue(): string {
        return this.value;
    }

    equals(other: OrderId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
