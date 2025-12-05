import { DomainException } from '../../shared/exceptions';
import { ValueObject } from '../../shared/interfaces';

interface AddressProps {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

export class Address extends ValueObject<AddressProps> {
  private constructor(props: AddressProps) {
    super(props);
  }

  static create(props: AddressProps): Address {
    if (!props.street || props.street.trim().length === 0) {
      throw new DomainException('Street is required');
    }

    if (!props.number || props.number.trim().length === 0) {
      throw new DomainException('Number is required');
    }

    if (!props.neighborhood || props.neighborhood.trim().length === 0) {
      throw new DomainException('Neighborhood is required');
    }

    if (!props.city || props.city.trim().length === 0) {
      throw new DomainException('City is required');
    }

    if (!props.state || props.state.trim().length === 0) {
      throw new DomainException('State is required');
    }

    if (!props.zipCode || !Address.isValidZipCode(props.zipCode)) {
      throw new DomainException('Invalid zip code');
    }

    return new Address(props);
  }

  private static isValidZipCode(zipCode: string): boolean {
    // Remove hífens e espaços
    const cleaned = zipCode.replace(/[-\s]/g, '');
    // CEP brasileiro tem 8 dígitos
    return /^\d{8}$/.test(cleaned);
  }

  get street(): string {
    return this.props.street;
  }

  get number(): string {
    return this.props.number;
  }

  get complement(): string | undefined {
    return this.props.complement;
  }

  get neighborhood(): string {
    return this.props.neighborhood;
  }

  get city(): string {
    return this.props.city;
  }

  get state(): string {
    return this.props.state;
  }

  get zipCode(): string {
    return this.props.zipCode;
  }

  get latitude(): number | undefined {
    return this.props.latitude;
  }

  get longitude(): number | undefined {
    return this.props.longitude;
  }

  hasCoordinates(): boolean {
    return this.latitude !== undefined && this.longitude !== undefined;
  }

  toString(): string {
    const parts = [
      this.street,
      this.number,
      this.complement,
      this.neighborhood,
      this.city,
      this.state,
      this.zipCode,
    ].filter(Boolean);

    return parts.join(', ');
  }
}
