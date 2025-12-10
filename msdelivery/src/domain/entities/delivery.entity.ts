import { DeliveryStatus } from '../enums/delivery-status.enum';
import { Location } from '../value-objects/location.vo';
import { DeliveryPersonEntity } from './delivery-person.entity';

export interface DeliveryProps {
  id?: number;
  orderId: number;
  deliveryPersonId?: number;
  deliveryPerson?: DeliveryPersonEntity;
  status: DeliveryStatus;
  customerLocation: Location;
  customerAddress: string;
  assignedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  estimatedDeliveryTime?: number;
  actualDeliveryTime?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DeliveryEntity {
  private readonly props: DeliveryProps;

  private constructor(props: DeliveryProps) {
    this.props = props;
  }

  static create(props: Omit<DeliveryProps, 'status'>): DeliveryEntity {
    return new DeliveryEntity({
      ...props,
      status: DeliveryStatus.PENDING,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  static reconstitute(props: DeliveryProps): DeliveryEntity {
    return new DeliveryEntity(props);
  }

  // Getters
  get id(): number | undefined {
    return this.props.id;
  }

  get orderId(): number {
    return this.props.orderId;
  }

  get deliveryPersonId(): number | undefined {
    return this.props.deliveryPersonId;
  }

  get deliveryPerson(): DeliveryPersonEntity | undefined {
    return this.props.deliveryPerson;
  }

  get status(): DeliveryStatus {
    return this.props.status;
  }

  get customerLocation(): Location {
    return this.props.customerLocation;
  }

  get customerAddress(): string {
    return this.props.customerAddress;
  }

  get assignedAt(): Date | undefined {
    return this.props.assignedAt;
  }

  get pickedUpAt(): Date | undefined {
    return this.props.pickedUpAt;
  }

  get deliveredAt(): Date | undefined {
    return this.props.deliveredAt;
  }

  get cancelledAt(): Date | undefined {
    return this.props.cancelledAt;
  }

  get estimatedDeliveryTime(): number | undefined {
    return this.props.estimatedDeliveryTime;
  }

  get actualDeliveryTime(): number | undefined {
    return this.props.actualDeliveryTime;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  // Domain Methods
  canBeAssigned(): boolean {
    return this.props.status === DeliveryStatus.PENDING;
  }

  isInFinalStatus(): boolean {
    const finalStatuses: DeliveryStatus[] = [
      DeliveryStatus.DELIVERED,
      DeliveryStatus.CANCELLED,
      DeliveryStatus.FAILED,
    ];
    return finalStatuses.includes(this.props.status);
  }

  assign(deliveryPersonId: number, estimatedDeliveryTime?: number): void {
    if (!this.canBeAssigned()) {
      throw new Error(
        `Entrega já foi atribuída ou está em andamento. Status atual: ${this.props.status}`,
      );
    }
    this.props.deliveryPersonId = deliveryPersonId;
    this.props.status = DeliveryStatus.ASSIGNED;
    this.props.assignedAt = new Date();
    this.props.estimatedDeliveryTime = estimatedDeliveryTime;
    this.props.updatedAt = new Date();
  }

  pickUp(): void {
    if (this.props.status !== DeliveryStatus.ASSIGNED) {
      throw new Error('Entrega precisa estar atribuída para ser coletada');
    }
    this.props.status = DeliveryStatus.PICKED_UP;
    this.props.pickedUpAt = new Date();
    this.props.updatedAt = new Date();
  }

  startTransit(): void {
    if (this.props.status !== DeliveryStatus.PICKED_UP) {
      throw new Error('Entrega precisa estar coletada para iniciar trânsito');
    }
    this.props.status = DeliveryStatus.IN_TRANSIT;
    this.props.updatedAt = new Date();
  }

  complete(): void {
    if (this.props.status !== DeliveryStatus.IN_TRANSIT && this.props.status !== DeliveryStatus.PICKED_UP) {
      throw new Error('Entrega precisa estar em trânsito ou coletada para ser completada');
    }
    this.props.status = DeliveryStatus.DELIVERED;
    this.props.deliveredAt = new Date();
    
    if (this.props.assignedAt) {
      const diffMs = this.props.deliveredAt.getTime() - this.props.assignedAt.getTime();
      this.props.actualDeliveryTime = Math.round(diffMs / 60000);
    }
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (this.isInFinalStatus()) {
      throw new Error('Não é possível cancelar uma entrega finalizada');
    }
    this.props.status = DeliveryStatus.CANCELLED;
    this.props.cancelledAt = new Date();
    this.props.updatedAt = new Date();
  }

  fail(): void {
    if (this.isInFinalStatus()) {
      throw new Error('Não é possível marcar como falha uma entrega finalizada');
    }
    this.props.status = DeliveryStatus.FAILED;
    this.props.updatedAt = new Date();
  }

  changeStatus(newStatus: DeliveryStatus): void {
    switch (newStatus) {
      case DeliveryStatus.PICKED_UP:
        this.pickUp();
        break;
      case DeliveryStatus.IN_TRANSIT:
        this.startTransit();
        break;
      case DeliveryStatus.DELIVERED:
        this.complete();
        break;
      case DeliveryStatus.CANCELLED:
        this.cancel();
        break;
      case DeliveryStatus.FAILED:
        this.fail();
        break;
      default:
        this.props.status = newStatus;
        this.props.updatedAt = new Date();
    }
  }

  toJSON(): Record<string, any> {
    return {
      id: this.props.id,
      orderId: this.props.orderId,
      deliveryPersonId: this.props.deliveryPersonId,
      deliveryPerson: this.props.deliveryPerson?.toJSON(),
      status: this.props.status,
      customerLatitude: this.props.customerLocation.latitude,
      customerLongitude: this.props.customerLocation.longitude,
      customerAddress: this.props.customerAddress,
      assignedAt: this.props.assignedAt,
      pickedUpAt: this.props.pickedUpAt,
      deliveredAt: this.props.deliveredAt,
      cancelledAt: this.props.cancelledAt,
      estimatedDeliveryTime: this.props.estimatedDeliveryTime,
      actualDeliveryTime: this.props.actualDeliveryTime,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
