export class ServiceOrigin {
    private readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    static create(value: string): ServiceOrigin {
        if (!value || value.trim().length === 0) {
            throw new Error('ServiceOrigin cannot be empty');
        }

        const validOrigins = ['orders', 'tracking', 'mstracking', 'msorders'];
        if (!validOrigins.includes(value.toLowerCase())) {
            throw new Error(`Invalid service origin: ${value}. Valid values are: ${validOrigins.join(', ')}`);
        }

        return new ServiceOrigin(value.toLowerCase());
    }

    getValue(): string {
        return this.value;
    }

    equals(other: ServiceOrigin): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
