import { OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
export declare class DeliveryService implements OnModuleInit {
    private client;
    private deliveryPersonService;
    constructor(client: ClientGrpc);
    onModuleInit(): void;
    getDeliveryPerson(deliveryPersonId: number): Observable<any>;
    findAvailableDeliveryPersons(latitude: number, longitude: number, radiusKm: number, vehicleType?: string): Observable<any>;
    updateDeliveryPersonStatus(deliveryPersonId: number, status: string): Observable<any>;
    updateDeliveryPersonLocation(deliveryPersonId: number, latitude: number, longitude: number, speed?: number, heading?: number, accuracy?: number): Observable<any>;
    getDeliveryByOrder(orderId: string): Observable<unknown>;
    getActiveDeliveries(): Observable<unknown>;
}
