import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';

interface DeliveryPersonService {
  // Queries
  GetDeliveryPerson(data: { deliveryPersonId: number }): Observable<any>;
  ListAllDeliveryPersons(data: { status?: string }): Observable<any>;
  FindAvailableDeliveryPersons(data: {
    latitude: number;
    longitude: number;
    radiusKm: number;
    vehicleType?: string;
  }): Observable<any>;
  
  // CRUD Mutations
  CreateDeliveryPerson(data: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
    vehicleType: string;
    licensePlate?: string;
  }): Observable<any>;
  UpdateDeliveryPerson(data: {
    id: number;
    name?: string;
    email?: string;
    phone?: string;
    vehicleType?: string;
    licensePlate?: string;
  }): Observable<any>;
  DeleteDeliveryPerson(data: { id: number }): Observable<any>;
  
  // Status/Location Mutations
  UpdateDeliveryPersonStatus(data: {
    deliveryPersonId: number;
    status: string;
  }): Observable<any>;
  UpdateDeliveryPersonLocation(data: {
    deliveryPersonId: number;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
  }): Observable<any>;
  
  // Activate/Deactivate Mutations
  ActivateDeliveryPerson(data: { id: number }): Observable<any>;
  DeactivateDeliveryPerson(data: { id: number }): Observable<any>;
}

interface DeliveryService {
  GetDeliveryByOrder(data: { orderId: number }): Observable<any>;
  GetActiveDeliveries(data: { statuses?: string[] }): Observable<any>;
  GetDeliveriesByDeliveryPerson(data: { deliveryPersonId: number }): Observable<any>;
  UpdateDeliveryStatus(data: { deliveryId: number; status: string }): Observable<any>;
  AssignDelivery(data: { orderId: number; deliveryPersonId?: number }): Observable<any>;
  CreateDelivery(data: { 
    orderId: number; 
    customerLatitude: number;
    customerLongitude: number;
    customerAddress: string;
  }): Observable<any>;
}

@Injectable()
export class DeliveryServiceImpl implements OnModuleInit {
  private deliveryPersonService: DeliveryPersonService;
  private deliveryService: DeliveryService;

  constructor(@Inject('DELIVERY_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.deliveryPersonService = this.client.getService<DeliveryPersonService>(
      'DeliveryPersonService',
    );
    this.deliveryService = this.client.getService<DeliveryService>(
      'DeliveryService',
    );
  }

  listAllDeliveryPersons(status?: string) {
    return this.deliveryPersonService.ListAllDeliveryPersons({ status });
  }

  getDeliveryPerson(deliveryPersonId: number) {
    return this.deliveryPersonService.GetDeliveryPerson({ deliveryPersonId });
  }

  findAvailableDeliveryPersons(
    latitude: number,
    longitude: number,
    radiusKm: number,
    vehicleType?: string,
  ) {
    return this.deliveryPersonService.FindAvailableDeliveryPersons({
      latitude,
      longitude,
      radiusKm,
      vehicleType,
    });
  }

  updateDeliveryPersonStatus(deliveryPersonId: number, status: string) {
    return this.deliveryPersonService.UpdateDeliveryPersonStatus({
      deliveryPersonId,
      status,
    });
  }

  updateDeliveryPersonLocation(
    deliveryPersonId: number,
    latitude: number,
    longitude: number,
    speed?: number,
    heading?: number,
    accuracy?: number,
  ) {
    return this.deliveryPersonService.UpdateDeliveryPersonLocation({
      deliveryPersonId,
      latitude,
      longitude,
      speed,
      heading,
      accuracy,
    });
  }

  // ==================== CRUD MUTATIONS ====================

  createDeliveryPerson(
    name: string,
    email: string,
    phone: string,
    cpf: string,
    vehicleType: string,
    licensePlate?: string,
  ) {
    return this.deliveryPersonService.CreateDeliveryPerson({
      name,
      email,
      phone,
      cpf,
      vehicleType,
      licensePlate,
    });
  }

  updateDeliveryPerson(
    id: number,
    name?: string,
    email?: string,
    phone?: string,
    vehicleType?: string,
    licensePlate?: string,
  ) {
    return this.deliveryPersonService.UpdateDeliveryPerson({
      id,
      name,
      email,
      phone,
      vehicleType,
      licensePlate,
    });
  }

  deleteDeliveryPerson(id: number) {
    return this.deliveryPersonService.DeleteDeliveryPerson({ id });
  }

  // ==================== ACTIVATE/DEACTIVATE ====================

  activateDeliveryPerson(id: number) {
    return this.deliveryPersonService.ActivateDeliveryPerson({ id });
  }

  deactivateDeliveryPerson(id: number) {
    return this.deliveryPersonService.DeactivateDeliveryPerson({ id });
  }

  // Métodos para deliveries
  getDeliveryByOrder(orderId: string) {
    return this.deliveryService.GetDeliveryByOrder({ orderId: parseInt(orderId) });
  }

  getActiveDeliveries() {
    return this.deliveryService.GetActiveDeliveries({ statuses: [] });
  }

  getDeliveriesByDeliveryPerson(deliveryPersonId: number) {
    return this.deliveryService.GetDeliveriesByDeliveryPerson({ deliveryPersonId });
  }

  updateDeliveryStatus(deliveryId: number, status: string) {
    return this.deliveryService.UpdateDeliveryStatus({ deliveryId, status });
  }

  assignDelivery(orderId: number, deliveryPersonId?: number) {
    return this.deliveryService.AssignDelivery({ orderId, deliveryPersonId });
  }

  createDelivery(
    orderId: number,
    customerLatitude: number,
    customerLongitude: number,
    customerAddress: string,
  ) {
    return this.deliveryService.CreateDelivery({
      orderId,
      customerLatitude,
      customerLongitude,
      customerAddress,
    });
  }
}
