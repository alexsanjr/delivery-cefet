import { DeliveryService } from './delivery.service';
import { DeliveryPerson, Delivery } from './models/delivery.model';
import { UpdateDeliveryPersonStatusInput, UpdateDeliveryPersonLocationInput } from './dto/delivery.input';
export declare class DeliveryResolver {
    private readonly deliveryService;
    constructor(deliveryService: DeliveryService);
    listDeliveryPersons(status?: string): Promise<DeliveryPerson[]>;
    getDeliveryPerson(id: number): Promise<DeliveryPerson | null>;
    findAvailableDeliveryPersonsNearby(latitude: number, longitude: number, radiusKm: number, vehicleType?: string): Promise<DeliveryPerson[]>;
    updateDeliveryPersonStatus(input: UpdateDeliveryPersonStatusInput): Promise<DeliveryPerson | null>;
    updateDeliveryPersonLocation(input: UpdateDeliveryPersonLocationInput): Promise<DeliveryPerson | null>;
    listDeliveries(): Promise<Delivery[]>;
    getDeliveryByOrder(orderId: string): Promise<Delivery | null>;
    getDeliveriesByDeliveryPerson(deliveryPersonId: number): Promise<Delivery[]>;
}
