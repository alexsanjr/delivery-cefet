import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { DeliveryPersonsService } from './delivery-persons.service';
import { DeliveryPersonStatus } from './models/delivery-person-status.enum';

interface GetDeliveryPersonRequest {
  deliveryPersonId: string;
}

interface GetDeliveryPersonResponse {
  success: boolean;
  deliveryPerson: any;
}

interface FindAvailableRequest {
  latitude: number;
  longitude: number;
  radiusKm: number;
  vehicleType?: string;
}

interface DeliveryPersonInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  licensePlate: string;
  status: string;
  rating: number;
  totalDeliveries: number;
  currentLatitude: number;
  currentLongitude: number;
  lastLocationUpdate: string;
  isActive: boolean;
}

interface DeliveryPersonsList {
  deliveryPersons: DeliveryPersonInfo[];
}

interface UpdateStatusRequest {
  deliveryPersonId: string;
  status: string;
}

interface UpdateLocationRequest {
  deliveryPersonId: string;
  latitude: number;
  longitude: number;
}

interface UpdateResponse {
  success: boolean;
  message: string;
}

@Controller()
export class DeliveryPersonsGrpcController {
  constructor(private readonly deliveryPersonsService: DeliveryPersonsService) {}

  @GrpcMethod('DeliveryPersonService', 'GetDeliveryPerson')
  async getDeliveryPerson(data: GetDeliveryPersonRequest): Promise<GetDeliveryPersonResponse> {
    const deliveryPerson = await this.deliveryPersonsService.findOne(data.deliveryPersonId);

    return {
      success: true,
      deliveryPerson: {
        id: deliveryPerson.id,
        name: deliveryPerson.name,
        email: deliveryPerson.email,
        phone: deliveryPerson.phone,
        vehicleType: deliveryPerson.vehicleType,
        licensePlate: deliveryPerson.licensePlate || '',
        status: deliveryPerson.status,
        rating: deliveryPerson.rating,
        totalDeliveries: deliveryPerson.totalDeliveries,
        currentLatitude: deliveryPerson.currentLatitude || 0,
        currentLongitude: deliveryPerson.currentLongitude || 0,
        lastLocationUpdate: deliveryPerson.lastLocationUpdate?.toISOString() || '',
        isActive: deliveryPerson.isActive,
      },
    };
  }

  @GrpcMethod('DeliveryPersonService', 'FindAvailableDeliveryPersons')
  async findAvailableDeliveryPersons(data: FindAvailableRequest): Promise<DeliveryPersonsList> {
    const { latitude, longitude, radiusKm, vehicleType } = data;

    let deliveryPersons = await this.deliveryPersonsService.findAvailableNearby(
      latitude,
      longitude,
      radiusKm,
    );

    if (vehicleType) {
      deliveryPersons = deliveryPersons.filter((dp) => dp.vehicleType === vehicleType);
    }

    const deliveryPersonsInfo: DeliveryPersonInfo[] = deliveryPersons.map((dp) => ({
      id: dp.id,
      name: dp.name,
      email: dp.email,
      phone: dp.phone,
      vehicleType: dp.vehicleType,
      licensePlate: dp.licensePlate || '',
      status: dp.status,
      rating: dp.rating,
      totalDeliveries: dp.totalDeliveries,
      currentLatitude: dp.currentLatitude || 0,
      currentLongitude: dp.currentLongitude || 0,
      lastLocationUpdate: dp.lastLocationUpdate?.toISOString() || '',
      isActive: dp.isActive,
    }));

    return { deliveryPersons: deliveryPersonsInfo };
  }

  @GrpcMethod('DeliveryPersonService', 'UpdateDeliveryPersonStatus')
  async updateDeliveryPersonStatus(data: UpdateStatusRequest): Promise<UpdateResponse> {
    await this.deliveryPersonsService.updateStatus({
      deliveryPersonId: data.deliveryPersonId,
      status: data.status as DeliveryPersonStatus,
    });

    return {
      success: true,
      message: "Status atualizado com sucesso",
    };
  }

  @GrpcMethod('DeliveryPersonService', 'UpdateDeliveryPersonLocation')
  async updateDeliveryPersonLocation(data: UpdateLocationRequest): Promise<UpdateResponse> {
    await this.deliveryPersonsService.updateLocation({
      deliveryPersonId: data.deliveryPersonId,
      latitude: data.latitude,
      longitude: data.longitude,
    });

    return {
      success: true,
      message: "Localização atualizada com sucesso",
    };
  }
}
