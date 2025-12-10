import { DeliveryPersonStatus } from '../enums/delivery-person-status.enum';
import { VehicleType } from '../enums/vehicle-type.enum';
import { Cpf } from '../value-objects/cpf.vo';
import { Email } from '../value-objects/email.vo';
import { Phone } from '../value-objects/phone.vo';
import { Location } from '../value-objects/location.vo';

export interface DeliveryPersonProps {
  id?: number;
  name: string;
  email: Email;
  phone: Phone;
  cpf: Cpf;
  vehicleType: VehicleType;
  licensePlate?: string;
  status: DeliveryPersonStatus;
  rating: number;
  totalDeliveries: number;
  currentLocation?: Location;
  lastLocationUpdate?: Date;
  isActive: boolean;
  joinedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DeliveryPersonEntity {
  private readonly props: DeliveryPersonProps;

  private constructor(props: DeliveryPersonProps) {
    this.props = props;
  }

  static create(props: DeliveryPersonProps): DeliveryPersonEntity {
    return new DeliveryPersonEntity({
      ...props,
      status: props.status ?? DeliveryPersonStatus.OFFLINE,
      rating: props.rating ?? 5.0,
      totalDeliveries: props.totalDeliveries ?? 0,
      isActive: props.isActive ?? true,
      joinedAt: props.joinedAt ?? new Date(),
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  static reconstitute(props: DeliveryPersonProps): DeliveryPersonEntity {
    return new DeliveryPersonEntity(props);
  }

  // Getters
  get id(): number | undefined {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get phone(): Phone {
    return this.props.phone;
  }

  get cpf(): Cpf {
    return this.props.cpf;
  }

  get vehicleType(): VehicleType {
    return this.props.vehicleType;
  }

  get licensePlate(): string | undefined {
    return this.props.licensePlate;
  }

  get status(): DeliveryPersonStatus {
    return this.props.status;
  }

  get rating(): number {
    return this.props.rating;
  }

  get totalDeliveries(): number {
    return this.props.totalDeliveries;
  }

  get currentLocation(): Location | undefined {
    return this.props.currentLocation;
  }

  get lastLocationUpdate(): Date | undefined {
    return this.props.lastLocationUpdate;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get joinedAt(): Date | undefined {
    return this.props.joinedAt;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  // Domain Methods
  canBeAssigned(): boolean {
    return this.props.isActive && this.props.status === DeliveryPersonStatus.AVAILABLE;
  }

  canChangeToStatus(newStatus: DeliveryPersonStatus): boolean {
    // Entregador desativado não pode mudar para AVAILABLE ou BUSY
    if (!this.props.isActive) {
      return newStatus === DeliveryPersonStatus.OFFLINE || newStatus === DeliveryPersonStatus.ON_BREAK;
    }
    return true;
  }

  canUpdateLocation(): boolean {
    return this.props.status !== DeliveryPersonStatus.OFFLINE;
  }

  changeStatus(newStatus: DeliveryPersonStatus): void {
    if (!this.canChangeToStatus(newStatus)) {
      throw new Error(
        'Entregador desativado não pode ficar disponível ou ocupado. Reative o entregador primeiro.',
      );
    }
    this.props.status = newStatus;
    this.props.updatedAt = new Date();
  }

  updateLocation(location: Location): void {
    if (!this.canUpdateLocation()) {
      throw new Error(
        'Não é possível atualizar localização de entregador offline. Mude o status primeiro.',
      );
    }
    this.props.currentLocation = location;
    this.props.lastLocationUpdate = new Date();
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (this.props.isActive) {
      throw new Error('Entregador já está ativo');
    }
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    if (!this.props.isActive) {
      throw new Error('Entregador já está desativado');
    }
    this.props.isActive = false;
    this.props.status = DeliveryPersonStatus.OFFLINE;
    this.props.updatedAt = new Date();
  }

  incrementDeliveries(): void {
    this.props.totalDeliveries += 1;
    this.props.updatedAt = new Date();
  }

  updateRating(newRating: number): void {
    if (newRating < 0 || newRating > 5) {
      throw new Error('Rating deve estar entre 0 e 5');
    }
    this.props.rating = newRating;
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      id: this.props.id,
      name: this.props.name,
      email: this.props.email.value,
      phone: this.props.phone.value,
      cpf: this.props.cpf.value,
      vehicleType: this.props.vehicleType,
      licensePlate: this.props.licensePlate,
      status: this.props.status,
      rating: this.props.rating,
      totalDeliveries: this.props.totalDeliveries,
      currentLatitude: this.props.currentLocation?.latitude,
      currentLongitude: this.props.currentLocation?.longitude,
      lastLocationUpdate: this.props.lastLocationUpdate,
      isActive: this.props.isActive,
      joinedAt: this.props.joinedAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
